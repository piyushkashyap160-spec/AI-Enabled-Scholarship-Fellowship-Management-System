import Disbursement from '../models/Disbursement.js';
import Application from '../models/Application.js';
import AuditLog from '../models/AuditLog.js';
import { sendNotification } from '../services/notificationService.js';

export const getMyDisbursements = async (req, res, next) => {
  try {
    const userApps = await Application.find({ applicantId: req.user._id });
    const appIds = userApps.map(a => a._id);

    const disbursements = await Disbursement.find({ applicationId: { $in: appIds } })
      .populate({
        path: 'applicationId',
        populate: { path: 'schemeId' }
      })
      .sort({ installmentNo: 1 });

    res.json({
      success: true,
      count: disbursements.length,
      disbursements
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProgressReport = async (req, res, next) => {
  try {
    const { id } = req.params; // disbursementId

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid progress report file (PDF/JPG).' });
    }

    const disbursement = await Disbursement.findById(id).populate({
      path: 'applicationId',
      populate: { path: 'schemeId' }
    });

    if (!disbursement) {
      return res.status(404).json({ success: false, message: 'Disbursement milestone not found.' });
    }

    disbursement.progressReportPath = req.file.path;
    disbursement.guideApproved = true; // Mark certified by research guide
    await disbursement.save();

    res.json({
      success: true,
      message: 'Progress report and supervisor certification submitted successfully.',
      disbursement
    });
  } catch (error) {
    next(error);
  }
};

export const releaseDisbursement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks = 'Disbursement released via DBT PFMS', transactionId } = req.body;

    const disbursement = await Disbursement.findById(id).populate({
      path: 'applicationId',
      populate: { path: 'applicantId schemeId' }
    });

    if (!disbursement) {
      return res.status(404).json({ success: false, message: 'Disbursement not found.' });
    }

    const txn = transactionId || `PFMS${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    disbursement.status = 'released';
    disbursement.releasedAt = new Date();
    disbursement.transactionId = txn;
    disbursement.remarks = remarks;
    await disbursement.save();

    const app = disbursement.applicationId;
    if (app && app.status !== 'DISBURSING') {
      app.status = 'DISBURSING';
      app.stageHistory.push({
        stage: 'DISBURSING',
        by: req.user.name,
        remark: `Installment #${disbursement.installmentNo} released. Ref: ${txn}`
      });
      await app.save();
    }

    // Audit Log
    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'RELEASE_DISBURSEMENT',
      entityType: 'Disbursement',
      entityId: id,
      after: {
        amount: disbursement.amount,
        installmentNo: disbursement.installmentNo,
        transactionId: txn
      },
      reason: remarks,
      ip: req.ip || '127.0.0.1'
    });

    // Notify student
    if (app?.applicantId) {
      await sendNotification({
        userId: app.applicantId._id,
        type: 'DISBURSEMENT_RELEASED',
        templateKey: 'DISBURSEMENT_RELEASED',
        templateParams: {
          installmentNo: String(disbursement.installmentNo),
          amount: String(disbursement.amount)
        },
        subject: `Fellowship Installment #${disbursement.installmentNo} Released`,
        body: `MoTA Fellowship installment #${disbursement.installmentNo} of ₹${disbursement.amount.toLocaleString('en-IN')} has been transferred to your account. Transaction Ref: ${txn}.`,
        link: '/applicant/fellowship'
      });
    }

    res.json({
      success: true,
      message: `Installment #${disbursement.installmentNo} marked as released.`,
      disbursement
    });
  } catch (error) {
    next(error);
  }
};
