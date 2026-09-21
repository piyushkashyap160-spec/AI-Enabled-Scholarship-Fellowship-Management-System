import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Disbursement from '../models/Disbursement.js';
import Application from '../models/Application.js';
import AuditLog from '../models/AuditLog.js';
import { sendNotification } from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

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

export const getPendingDisbursements = async (req, res, next) => {
  try {
    const disbursements = await Disbursement.find({
      status: { $ne: 'released' },
      $or: [
        { progressReportPath: { $ne: null } },
        { guideApproved: true }
      ]
    })
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'applicantId', select: 'name email phone profile' },
          { path: 'schemeId', select: 'name code stipendAmountPerYear' }
        ]
      })
      .sort({ createdAt: -1 });

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

    // Role-based Authorization: Applicant can only upload to their own application's disbursement
    if (req.user.role === 'applicant') {
      const applicantId = disbursement.applicationId?.applicantId ? disbursement.applicationId.applicantId.toString() : '';
      if (applicantId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to upload progress reports for this fellowship milestone.'
        });
      }
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

export const getDisbursementReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const disbursement = await Disbursement.findById(id).populate({
      path: 'applicationId',
      populate: { path: 'applicantId' }
    });

    if (!disbursement || !disbursement.progressReportPath) {
      return res.status(404).json({ success: false, message: 'Progress report not found.' });
    }

    const application = disbursement.applicationId;
    if (req.user.role === 'applicant') {
      const applicantId = application?.applicantId?._id ? application.applicantId._id.toString() : application?.applicantId?.toString();
      if (applicantId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this progress report.' });
      }
    } else if (!['verifier', 'officer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this progress report.' });
    }

    const resolvedPath = path.resolve(disbursement.progressReportPath);
    if (!resolvedPath.toLowerCase().startsWith(uploadsDir.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, message: 'File is unavailable on the server.' });
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : (['.png', '.jpg', '.jpeg'].includes(ext) ? 'image/jpeg' : 'application/octet-stream');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(resolvedPath)}"`);

    fs.createReadStream(resolvedPath).pipe(res);
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
