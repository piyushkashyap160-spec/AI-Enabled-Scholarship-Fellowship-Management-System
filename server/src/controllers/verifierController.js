import Application from '../models/Application.js';
import Document from '../models/Document.js';
import Deficiency from '../models/Deficiency.js';
import VerificationLog from '../models/VerificationLog.js';
import AuditLog from '../models/AuditLog.js';
import { sendNotification } from '../services/notificationService.js';

export const getVerifierQueue = async (req, res, next) => {
  try {
    const { schemeId, status, flagged, state, search } = req.query;

    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    } else {
      filter.status = { $in: ['UNDER_VERIFICATION', 'AUTO_VERIFIED', 'DEFICIENT', 'OCR_PROCESSING'] };
    }

    if (schemeId) {
      filter.schemeId = schemeId;
    }

    let applications = await Application.find(filter)
      .populate('schemeId')
      .populate('applicantId', '-passwordHash')
      .sort({ updatedAt: -1 });

    // Filter by flagged items if requested
    if (flagged === 'true') {
      const appIds = applications.map(a => a._id);
      const flaggedDocs = await Document.find({
        applicationId: { $in: appIds },
        mismatches: { $exists: true, $ne: [] }
      });
      const flaggedAppIds = new Set(flaggedDocs.map(d => d.applicationId.toString()));
      applications = applications.filter(a => flaggedAppIds.has(a._id.toString()) || (a.flags && a.flags.length > 0));
    }

    // Filter by State if requested
    if (state) {
      applications = applications.filter(a => a.applicantId?.profile?.state?.toLowerCase() === state.toLowerCase());
    }

    // Search query filter (appNo or applicant name)
    if (search) {
      const q = search.toLowerCase();
      applications = applications.filter(a =>
        a.applicationNo.toLowerCase().includes(q) ||
        a.applicantId?.name.toLowerCase().includes(q) ||
        a.applicantId?.email.toLowerCase().includes(q)
      );
    }

    // Attach document summaries
    const appIds = applications.map(a => a._id);
    const allDocs = await Document.find({ applicationId: { $in: appIds } });

    const results = applications.map(app => {
      const appDocs = allDocs.filter(d => d.applicationId.toString() === app._id.toString());
      const hasFlags = appDocs.some(d => d.mismatches && d.mismatches.length > 0);
      const pendingCount = appDocs.filter(d => d.verificationStatus === 'needs_review').length;
      const approvedCount = appDocs.filter(d => d.verificationStatus === 'approved' || d.verificationStatus === 'auto_ok').length;

      return {
        ...app.toObject(),
        documentsSummary: {
          total: appDocs.length,
          approved: approvedCount,
          pending: pendingCount,
          hasFlags
        }
      };
    });

    res.json({
      success: true,
      count: results.length,
      queue: results
    });
  } catch (error) {
    next(error);
  }
};

export const documentDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, remark = '' } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'approved' or 'rejected'." });
    }

    const doc = await Document.findById(id).populate({
      path: 'applicationId',
      populate: { path: 'applicantId' }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    doc.verificationStatus = decision;
    doc.officerRemark = remark;
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();
    await doc.save();

    // Record Verification Log
    await VerificationLog.create({
      documentId: doc._id,
      applicationId: doc.applicationId._id,
      action: decision === 'approved' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
      actorType: 'VERIFIER',
      actorId: req.user._id,
      actorName: req.user.name,
      details: {
        docKey: doc.docKey,
        remark,
        confidence: doc.confidence,
        mismatches: doc.mismatches
      }
    });

    // Check application overall documents status
    const allDocs = await Document.find({ applicationId: doc.applicationId._id });
    const allApproved = allDocs.length > 0 && allDocs.every(d => ['approved', 'auto_ok'].includes(d.verificationStatus));
    const anyRejected = allDocs.some(d => d.verificationStatus === 'rejected');

    const app = doc.applicationId;
    if (allApproved && ['UNDER_VERIFICATION', 'AUTO_VERIFIED', 'OCR_PROCESSING'].includes(app.status)) {
      app.status = 'UNDER_SCRUTINY';
      app.stageHistory.push({
        stage: 'UNDER_SCRUTINY',
        by: req.user.name,
        remark: 'All uploaded documents verified and approved. Moved to Officer Scrutiny.'
      });
      await app.save();
    }

    res.json({
      success: true,
      message: `Document marked as ${decision}.`,
      document: doc,
      applicationStatus: app.status
    });
  } catch (error) {
    next(error);
  }
};

export const raiseDeficiency = async (req, res, next) => {
  try {
    const { id } = req.params; // applicationId
    const { docKey, reason, dueDays = 7 } = req.body;

    if (!docKey || !reason) {
      return res.status(400).json({ success: false, message: 'docKey and reason are required.' });
    }

    const application = await Application.findById(id).populate('applicantId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(dueDays));

    const deficiency = await Deficiency.create({
      applicationId: id,
      docKey,
      reason,
      raisedBy: req.user.name,
      dueDate,
      status: 'open'
    });

    // Update document status
    const doc = await Document.findOne({ applicationId: id, docKey });
    if (doc) {
      doc.verificationStatus = 'rejected';
      doc.officerRemark = reason;
      await doc.save();
    }

    // Update Application stage
    application.status = 'DEFICIENT';
    application.stageHistory.push({
      stage: 'DEFICIENT',
      by: req.user.name,
      remark: `Deficiency raised for ${docKey}: ${reason}`
    });
    await application.save();

    // Audit Log
    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'RAISE_DEFICIENCY',
      entityType: 'Application',
      entityId: id,
      reason: `Deficiency raised for ${docKey}: ${reason}`,
      ip: req.ip || '127.0.0.1'
    });

    // Send Notification
    await sendNotification({
      userId: application.applicantId._id,
      type: 'DEFICIENCY_RAISED',
      subject: `Action Required: Deficiency Notice for ${docKey}`,
      body: `Verifier ${req.user.name} has flagged your ${docKey}: "${reason}". Please upload a corrected document by ${dueDate.toLocaleDateString('en-IN')}.`,
      link: '/applicant/deficiencies'
    });

    res.status(201).json({
      success: true,
      message: 'Deficiency raised and notification dispatched to applicant.',
      deficiency
    });
  } catch (error) {
    next(error);
  }
};
