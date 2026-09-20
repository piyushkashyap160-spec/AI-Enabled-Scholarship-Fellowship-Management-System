import fs from 'fs';
import path from 'path';
import Document from '../models/Document.js';
import Application from '../models/Application.js';
import Deficiency from '../models/Deficiency.js';
import VerificationLog from '../models/VerificationLog.js';
import { processDocumentAsync } from '../services/ocrService.js';
import { sendNotification } from '../services/notificationService.js';

export const uploadDocument = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { docKey } = req.body;

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

    // Replace if document with this docKey already exists for this application
    const existingDoc = await Document.findOne({ applicationId: appId, docKey });
    let doc;

    if (existingDoc) {
      // Clean up old file from disk if exists
      if (fs.existsSync(existingDoc.storedPath)) {
        try { fs.unlinkSync(existingDoc.storedPath); } catch {}
      }
      existingDoc.originalName = req.file.originalname;
      existingDoc.storedPath = req.file.path;
      existingDoc.mimeType = req.file.mimetype;
      existingDoc.ocrStatus = 'pending';
      existingDoc.confidence = 0;
      existingDoc.classificationConfidence = 0;
      existingDoc.detectedDocType = 'unknown';
      existingDoc.matchedKeywords = [];
      existingDoc.mismatches = [];
      existingDoc.verificationStatus = 'needs_review';
      existingDoc.uploadedAt = new Date();
      doc = await existingDoc.save();
    } else {
      doc = await Document.create({
        applicationId: appId,
        docKey,
        originalName: req.file.originalname,
        storedPath: req.file.path,
        mimeType: req.file.mimetype,
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
    const doc = await Document.findById(id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
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
    const doc = await Document.findById(id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
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
    const { deficiencyId } = req.body;

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
      doc = await Document.findOne({ applicationId: deficiency.applicationId, docKey: deficiency.docKey });
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document record not found.' });
    }

    // Clean up old file
    if (fs.existsSync(doc.storedPath)) {
      try { fs.unlinkSync(doc.storedPath); } catch {}
    }

    doc.originalName = req.file.originalname;
    doc.storedPath = req.file.path;
    doc.mimeType = req.file.mimetype;
    doc.ocrStatus = 'pending';
    doc.mismatches = [];
    doc.confidence = 0;
    doc.classificationConfidence = 0;
    doc.detectedDocType = 'unknown';
    doc.matchedKeywords = [];
    doc.verificationStatus = 'needs_review';
    doc.uploadedAt = new Date();
    await doc.save();

    // Re-run OCR asynchronously
    setImmediate(async () => {
      await processDocumentAsync(doc._id);

      // Check updated doc
      const updatedDoc = await Document.findById(doc._id);
      if (deficiency && updatedDoc.mismatches.length === 0) {
        deficiency.status = 'resolved';
        deficiency.resolvedAt = new Date();
        deficiency.reuploadedDocId = doc._id;
        await deficiency.save();

        const app = await Application.findById(doc.applicationId);
        if (app) {
          app.status = 'UNDER_VERIFICATION';
          app.stageHistory.push({
            stage: 'UNDER_VERIFICATION',
            by: 'Applicant / AI OCR',
            remark: `Deficiency resolved for ${doc.docKey}. Returned to verification queue.`
          });
          await app.save();
        }
      }
    });

    res.json({
      success: true,
      message: 'Replacement document uploaded. AI OCR is verifying the updated file.',
      document: doc
    });
  } catch (error) {
    next(error);
  }
};
