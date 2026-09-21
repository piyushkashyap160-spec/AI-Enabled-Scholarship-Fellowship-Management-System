import Scheme from '../models/Scheme.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Disbursement from '../models/Disbursement.js';
import { generateSchemeMeritList } from '../services/meritService.js';
import { detectSystemAnomalies } from '../services/fraudService.js';
import { sendNotification } from '../services/notificationService.js';

export const getMeritList = async (req, res, next) => {
  try {
    const { schemeId } = req.params;
    const meritData = await generateSchemeMeritList(schemeId);
    res.json({ success: true, ...meritData });
  } catch (error) {
    next(error);
  }
};

export const publishMeritList = async (req, res, next) => {
  try {
    const { schemeId } = req.params;
    const meritData = await generateSchemeMeritList(schemeId);

    const { provisionalList, waitingList, scheme } = meritData;

    // Update Provisional Selected Candidates
    for (const item of provisionalList) {
      const app = await Application.findById(item.application._id);
      if (app) {
        app.status = 'SELECTED';
        app.isSelected = true;
        app.isWaitlisted = false;
        app.meritScore = item.meritScore;
        app.meritBreakdown = item.meritBreakdown;
        app.meritRank = item.meritRank;
        app.stageHistory.push({
          stage: 'SELECTED',
          by: req.user.name,
          remark: `Provisional Selection published. Merit Rank #${item.meritRank} under ${item.selectionCategory}.`
        });
        await app.save();

        // Create initial installment disbursement record
        const existingDisb = await Disbursement.findOne({ applicationId: app._id, installmentNo: 1 });
        if (!existingDisb) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + 1); // 1 month after award
          await Disbursement.create({
            applicationId: app._id,
            installmentNo: 1,
            amount: scheme.stipendAmountPerYear ? Math.round(scheme.stipendAmountPerYear / 2) : 192000,
            dueDate,
            status: 'pending'
          });
        }

        // Notify selected candidate
        await sendNotification({
          userId: item.applicantId,
          type: 'SELECTION_OFFER',
          templateKey: 'SELECTION_OFFER',
          templateParams: { schemeName: scheme.name },
          subject: `Provisional Selection Offer: ${scheme.name}`,
          body: `Congratulations! You have been provisionally selected for ${scheme.name} (Merit Rank #${item.meritRank}). Please view your award acceptance details.`,
          link: `/applicant/applications/${app._id}`
        });
      }
    }

    // Update Waitlisted Candidates
    for (const item of waitingList) {
      const app = await Application.findById(item.application._id);
      if (app) {
        app.status = 'WAITLISTED';
        app.isSelected = false;
        app.isWaitlisted = true;
        app.meritScore = item.meritScore;
        app.meritBreakdown = item.meritBreakdown;
        app.meritRank = item.meritRank;
        app.stageHistory.push({
          stage: 'WAITLISTED',
          by: req.user.name,
          remark: `Merit list published. Placed on Official Waiting List (Waitlist Rank #${item.waitlistRank}).`
        });
        await app.save();

        await sendNotification({
          userId: item.applicantId,
          type: 'MERIT_WAITLISTED',
          subject: `Merit List Published: ${scheme.name} (Waitlisted)`,
          body: `The merit list for ${scheme.name} has been published. You are on the waiting list at position #${item.waitlistRank}.`,
          link: `/applicant/applications/${app._id}`
        });
      }
    }

    // Audit Log for Merit Publication
    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'PUBLISH_MERIT_LIST',
      entityType: 'Scheme',
      entityId: schemeId,
      after: {
        totalSeats: scheme.totalSeats,
        selectedCount: provisionalList.length,
        waitlistedCount: waitingList.length
      },
      reason: `Published official merit list for scheme ${scheme.code}`,
      ip: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Merit list for ${scheme.name} published successfully. ${provisionalList.length} applicants selected, ${waitingList.length} waitlisted.`,
      selectedCount: provisionalList.length,
      waitlistedCount: waitingList.length
    });
  } catch (error) {
    next(error);
  }
};

export const overrideApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newStatus, reason } = req.body;

    if (!newStatus || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Both newStatus and a mandatory written reason are required for administrative overrides.'
      });
    }

    const application = await Application.findById(id).populate('applicantId').populate('schemeId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const beforeStatus = application.status;
    application.status = newStatus;
    application.selectionOverrideRemark = reason;
    application.stageHistory.push({
      stage: newStatus,
      by: `${req.user.name} (Ministry Admin Override)`,
      remark: `Administrative Override: ${reason}`
    });

    if (newStatus === 'SELECTED') {
      application.isSelected = true;
      application.isWaitlisted = false;
    } else if (newStatus === 'WAITLISTED') {
      application.isWaitlisted = true;
      application.isSelected = false;
    }

    await application.save();

    // MANDATORY Audit Log recording
    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ADMIN_APPLICATION_OVERRIDE',
      entityType: 'Application',
      entityId: id,
      before: { status: beforeStatus },
      after: { status: newStatus, overrideReason: reason },
      reason: `Admin Override from ${beforeStatus} to ${newStatus}: ${reason}`,
      ip: req.ip || '127.0.0.1'
    });

    // Notify applicant
    await sendNotification({
      userId: application.applicantId._id,
      type: 'STATUS_OVERRIDE',
      subject: `Application Status Updated: ${newStatus}`,
      body: `Your application #${application.applicationNo} status has been updated to ${newStatus} by Ministry Administration. Reason: "${reason}".`,
      link: `/applicant/applications/${application._id}`
    });

    res.json({
      success: true,
      message: `Status updated to ${newStatus} and recorded in official audit log.`,
      application
    });
  } catch (error) {
    next(error);
  }
};

export const getAnomalies = async (req, res, next) => {
  try {
    const anomalies = await detectSystemAnomalies();
    res.json({
      success: true,
      count: anomalies.length,
      anomalies
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const skip = (Number(page) - 1) * Number(limit);

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ at: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      logs
    });
  } catch (error) {
    next(error);
  }
};

export const verifyAuditTrail = async (req, res, next) => {
  try {
    const result = await AuditLog.verifyAuditIntegrity();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && role !== 'ALL') filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['applicant', 'verifier', 'officer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const beforeRole = user.role;
    user.role = role;
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'UPDATE_USER_ROLE',
      entityType: 'User',
      entityId: id,
      before: { role: beforeRole },
      after: { role },
      reason: `Changed role of user ${user.name} (${user.email}) from ${beforeRole} to ${role}`,
      ip: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `User role updated to ${role}.`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};
