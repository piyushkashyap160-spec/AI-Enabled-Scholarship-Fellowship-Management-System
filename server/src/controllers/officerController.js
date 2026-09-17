import Application from '../models/Application.js';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import { sendNotification } from '../services/notificationService.js';

export const getScrutinyList = async (req, res, next) => {
  try {
    const { schemeId, status } = req.query;

    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    } else {
      filter.status = { $in: ['UNDER_SCRUTINY', 'AUTO_VERIFIED', 'ELIGIBLE', 'INELIGIBLE'] };
    }

    if (schemeId) {
      filter.schemeId = schemeId;
    }

    const applications = await Application.find(filter)
      .populate('schemeId')
      .populate('applicantId', '-passwordHash')
      .sort({ updatedAt: -1 });

    const appIds = applications.map(a => a._id);
    const documents = await Document.find({ applicationId: { $in: appIds } });

    const enriched = applications.map(app => {
      const appDocs = documents.filter(d => d.applicationId.toString() === app._id.toString());
      return {
        ...app.toObject(),
        documents: appDocs
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      applications: enriched
    });
  } catch (error) {
    next(error);
  }
};

export const makeEligibilityDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, remarks } = req.body; // 'ELIGIBLE' | 'INELIGIBLE'

    if (!['ELIGIBLE', 'INELIGIBLE'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'ELIGIBLE' or 'INELIGIBLE'." });
    }

    if (!remarks) {
      return res.status(400).json({ success: false, message: "A written remark is mandatory for officer scrutiny decisions." });
    }

    const application = await Application.findById(id).populate('applicantId').populate('schemeId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const beforeStatus = application.status;
    application.status = decision;
    application.officerRemarks = remarks;
    application.stageHistory.push({
      stage: decision,
      by: req.user.name,
      remark: `Officer Scrutiny: Marked ${decision}. Remarks: ${remarks}`
    });
    await application.save();

    // Audit Log: Human officer decision
    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: `OFFICER_SCRUTINY_${decision}`,
      entityType: 'Application',
      entityId: id,
      before: { status: beforeStatus },
      after: { status: decision, officerRemarks: remarks },
      reason: remarks,
      ip: req.ip || '127.0.0.1'
    });

    // Notify applicant
    await sendNotification({
      userId: application.applicantId._id,
      type: `APPLICATION_${decision}`,
      subject: `Officer Scrutiny Complete: Application ${decision}`,
      body: `Your application #${application.applicationNo} for ${application.schemeId.name} has been marked ${decision} by the scrutinizing officer. Remarks: "${remarks}".`,
      link: `/applicant/applications/${application._id}`
    });

    res.json({
      success: true,
      message: `Application marked as ${decision}.`,
      application
    });
  } catch (error) {
    next(error);
  }
};

export const recommendForMerit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks = 'Recommended for merit ranking.' } = req.body;

    const application = await Application.findById(id).populate('schemeId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.status !== 'ELIGIBLE') {
      return res.status(400).json({ success: false, message: 'Only ELIGIBLE applications can be recommended for merit listing.' });
    }

    application.status = 'MERIT_LISTED';
    application.stageHistory.push({
      stage: 'MERIT_LISTED',
      by: req.user.name,
      remark: remarks
    });
    await application.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'RECOMMEND_FOR_MERIT',
      entityType: 'Application',
      entityId: id,
      reason: remarks,
      ip: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: 'Application recommended for merit listing.',
      application
    });
  } catch (error) {
    next(error);
  }
};
