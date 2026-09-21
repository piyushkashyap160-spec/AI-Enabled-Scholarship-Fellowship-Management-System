import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import Application from '../models/Application.js';
import Deficiency from '../models/Deficiency.js';
import VerificationLog from '../models/VerificationLog.js';
import AuditLog from '../models/AuditLog.js';
import { processDocumentAsync } from '../services/ocrService.js';
import { sendNotification } from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

export const uploadDocument = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { docKey, reason = '' } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a document file to upload.' });
    }

    if (!docKey) {
      return res.status(400).json({ success: false, message: 'docKey is required.' });
    }

    const application = await Application.findById(appId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (req.user.role === 'applicant' && application.applicantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to upload documents for this application.' });
    }

    // Check if document with this docKey already exists for this application
    const existingDoc = await Document.findOne({ applicationId: appId, docKey, isCurrent: true })
      || await Document.findOne({ applicationId: appId, docKey });

    let doc;

    if (existingDoc) {
      // Non-destructive versioning: preserve old file on disk and in database
      existingDoc.isCurrent = false;
      await existingDoc.save();

      const newVersion = (existingDoc.version || 1) + 1;
      doc = await Document.create({
        applicationId: appId,
        docKey,
        originalName: req.file.originalname,
        storedPath: req.file.path,
        mimeType: req.file.mimetype,
        version: newVersion,
        isCurrent: true,
        previousDocId: existingDoc._id,
        reuploadReason: reason || 'Replacement document uploaded',
        uploadedBy: req.user._id,
        ocrStatus: 'pending',
        verificationStatus: 'needs_review'
      });

      // If an open deficiency exists, resolve it
      await Deficiency.updateMany(
        { applicationId: appId, docKey, status: 'open' },
        { status: 'resolved', resolvedAt: new Date(), reuploadedDocId: doc._id }
      );
    } else {
      doc = await Document.create({
        applicationId: appId,
        docKey,
        originalName: req.file.originalname,
        storedPath: req.file.path,
        mimeType: req.file.mimetype,
        version: 1,
        isCurrent: true,
        uploadedBy: req.user._id,
        ocrStatus: 'pending',
        verificationStatus: 'needs_review'
      });
    }

    // Trigger OCR processing asynchronously in background (returns HTTP response immediately)
    setImmediate(() => {
      processDocumentAsync(doc._id);
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully. AI OCR extraction initiated in background.',
      document: doc
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id).populate('applicationId');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Role-based Authorization: Applicants can only view status of their own documents
    if (req.user.role === 'applicant') {
      const applicantId = doc.applicationId?.applicantId ? doc.applicationId.applicantId.toString() : '';
      if (applicantId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this document status.'
        });
      }
    }

    res.json({
      success: true,
      document: doc
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id).populate('applicationId');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const application = doc.applicationId;
    if (!application) {
      return res.status(404).json({ success: false, message: 'Associated application not found.' });
    }

    // Verifiers and Officers cannot arbitrarily delete applicant documents
    if (['verifier', 'officer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Staff verification officers cannot delete applicant documents.'
      });
    }

    // Applicants can only delete their own document while application is still in DRAFT
    if (req.user.role === 'applicant') {
      const applicantId = application.applicantId ? application.applicantId.toString() : '';
      if (applicantId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete documents for this application.'
        });
      }

      if (application.status !== 'DRAFT') {
        return res.status(400).json({
          success: false,
          message: 'Documents cannot be deleted after application has been submitted. Use the re-upload workflow for deficient documents.'
        });
      }
    }

    if (fs.existsSync(doc.storedPath)) {
      try { fs.unlinkSync(doc.storedPath); } catch {}
    }

    await Document.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Document deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const reuploadDocument = async (req, res, next) => {
  try {
    const { id } = req.params; // documentId or deficiencyId
    const { deficiencyId, reason = '' } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a replacement file.' });
    }

    let doc = await Document.findById(id);
    let deficiency = null;

    if (deficiencyId) {
      deficiency = await Deficiency.findById(deficiencyId);
    } else {
      deficiency = await Deficiency.findOne({ applicationId: doc?.applicationId, docKey: doc?.docKey, status: 'open' });
    }

    if (!doc && deficiency) {
      doc = await Document.findOne({ applicationId: deficiency.applicationId, docKey: deficiency.docKey, isCurrent: true })
        || await Document.findOne({ applicationId: deficiency.applicationId, docKey: deficiency.docKey });
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document record not found.' });
    }

    // Authorization check: Ensure applicant owns this application
    const application = await Application.findById(doc.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Associated application not found.' });
    }

    if (req.user.role === 'applicant' && application.applicantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to upload documents for this application.' });
    }

    // NON-DESTRUCTIVE VERSIONING:
    // Mark previous document as not current, preserve old file on disk for audit
    doc.isCurrent = false;
    await doc.save();

    const newVersion = (doc.version || 1) + 1;
    const reuploadReason = reason || deficiency?.reason || 'Replacement document submitted by applicant';

    const newDoc = await Document.create({
      applicationId: doc.applicationId,
      docKey: doc.docKey,
      originalName: req.file.originalname,
      storedPath: req.file.path,
      mimeType: req.file.mimetype,
      version: newVersion,
      isCurrent: true,
      previousDocId: doc._id,
      reuploadReason,
      uploadedBy: req.user._id,
      ocrStatus: 'pending',
      verificationStatus: 'needs_review'
    });

    // Link and resolve the deficiency
    if (deficiency) {
      deficiency.status = 'resolved';
      deficiency.resolvedAt = new Date();
      deficiency.reuploadedDocId = newDoc._id;
      await deficiency.save();
    } else {
      await Deficiency.updateMany(
        { applicationId: doc.applicationId, docKey: doc.docKey, status: 'open' },
        { status: 'resolved', resolvedAt: new Date(), reuploadedDocId: newDoc._id }
      );
    }

    // If no more open deficiencies on this application, return status to UNDER_VERIFICATION
    const remainingOpenDefs = await Deficiency.countDocuments({
      applicationId: doc.applicationId,
      status: 'open'
    });
    if (remainingOpenDefs === 0 && application.status === 'DEFICIENT') {
      application.status = 'UNDER_VERIFICATION';
      application.stageHistory.push({
        stage: 'UNDER_VERIFICATION',
        by: req.user.name,
        remark: `Replacement ${newDoc.docKey} (v${newDoc.version}) uploaded; application returned to verifier queue.`
      });
      await application.save();
    }

    // Record Verification Log & Audit Log
    await VerificationLog.create({
      documentId: newDoc._id,
      applicationId: doc.applicationId,
      action: 'DOCUMENT_REUPLOADED',
      actorType: 'SYSTEM',
      actorId: req.user._id,
      actorName: req.user.name,
      details: {
        docKey: newDoc.docKey,
        version: newDoc.version,
        previousDocId: doc._id,
        originalName: newDoc.originalName,
        reason: reuploadReason
      }
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'REUPLOAD_DOCUMENT',
      entityType: 'Document',
      entityId: newDoc._id.toString(),
      reason: `Version ${newDoc.version} uploaded for ${newDoc.docKey}: ${reuploadReason}`,
      ip: req.ip || '127.0.0.1'
    });

    // Notify applicant
    await sendNotification({
      userId: req.user._id,
      type: 'DOCUMENT_REUPLOADED',
      subject: `Replacement Document Submitted: ${newDoc.docKey}`,
      body: `Your replacement ${newDoc.docKey} (Version ${newDoc.version}) has been submitted and is awaiting verification.`,
      link: `/applicant/applications/${doc.applicationId}`
    });

    // Trigger OCR processing asynchronously in background
    setImmediate(() => {
      processDocumentAsync(newDoc._id);
    });

    res.json({
      success: true,
      message: `Replacement document (Version ${newDoc.version}) uploaded. AI OCR is verifying the updated file.`,
      document: newDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Securely stream an uploaded document file for in-browser preview / download
 * Requires authentication and verifies ownership or verifier/officer/admin role.
 */
export const getDocumentFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id).populate('applicationId');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const application = doc.applicationId;
    if (!application) {
      return res.status(404).json({ success: false, message: 'Associated application not found.' });
    }

    // Role-based Authorization:
    // - applicant: only allowed if this document belongs to their own application
    // - verifier, officer, admin: allowed
    const userRole = req.user?.role;
    const userId = req.user?._id ? req.user._id.toString() : '';

    if (userRole === 'applicant') {
      const applicantId = application.applicantId ? application.applicantId.toString() : '';
      if (applicantId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this document.'
        });
      }
    } else if (!['verifier', 'officer', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this document.'
      });
    }

    // Path verification
    if (!doc.storedPath) {
      return res.status(404).json({
        success: false,
        message: 'Document file is unavailable on the server.'
      });
    }

    // Resolve stored path safely and prevent path traversal
    const resolvedPath = path.resolve(doc.storedPath);
    if (!resolvedPath.toLowerCase().startsWith(uploadsDir.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this document.'
      });
    }

    // Verify file exists on disk
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file is unavailable on the server.'
      });
    }

    // Determine correct Content-Type
    const ext = path.extname(resolvedPath).toLowerCase();
    const origExt = path.extname(doc.originalName || '').toLowerCase();

    const MIME_MAP = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.txt': 'text/plain; charset=utf-8'
    };

    let contentType = MIME_MAP[ext] || MIME_MAP[origExt] || doc.mimeType || 'application/octet-stream';
    if (ext === '.txt') {
      contentType = 'text/plain; charset=utf-8';
    }

    const stat = fs.statSync(resolvedPath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);

    const isDownload = req.query.download === 'true';
    const dispositionType = isDownload ? 'attachment' : 'inline';
    const cleanFileName = (doc.originalName || path.basename(resolvedPath)).replace(/["\r\n]/g, '_');

    res.setHeader('Content-Disposition', `${dispositionType}; filename="${cleanFileName}"`);

    const stream = fs.createReadStream(resolvedPath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to stream document file.' });
      }
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};
