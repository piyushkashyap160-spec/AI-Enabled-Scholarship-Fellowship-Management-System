import Application from '../models/Application.js';
import Scheme from '../models/Scheme.js';
import Document from '../models/Document.js';
import Deficiency from '../models/Deficiency.js';
import AuditLog from '../models/AuditLog.js';
import { evaluate } from '../services/rulesEngine.js';
import { sendNotification } from '../services/notificationService.js';

export const createApplication = async (req, res, next) => {
  try {
    const { schemeId, formData = {} } = req.body;
    const applicantId = req.user._id;

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found.' });
    }

    if (!scheme.isActive) {
      return res.status(400).json({ success: false, message: 'This scheme is currently not accepting new applications.' });
    }

    // Check if an open/draft application already exists for this applicant and scheme
    const existing = await Application.findOne({
      applicantId,
      schemeId,
      status: { $nin: ['REJECTED', 'COMPLETED'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active application for this scheme.',
        applicationId: existing._id,
        applicationNo: existing.applicationNo
      });
    }

    const applicationNo = await Application.generateApplicationNo(scheme.code);

    const application = await Application.create({
      applicantId,
      schemeId,
      applicationNo,
      formData,
      status: 'DRAFT',
      stageHistory: [{
        stage: 'DRAFT',
        by: req.user.name,
        remark: 'Application draft created by applicant.'
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Draft application created successfully.',
      application
    });
  } catch (error) {
    next(error);
  }
};

export const updateDraftApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { formData } = req.body;

    const application = await Application.findOne({ _id: id, applicantId: req.user._id });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Submitted applications cannot be modified in draft mode.' });
    }

    application.formData = {
      ...application.formData,
      ...formData
    };

    await application.save();

    res.json({
      success: true,
      message: 'Draft application updated.',
      application
    });
  } catch (error) {
    next(error);
  }
};

export const submitApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await Application.findOne({ _id: id, applicantId: req.user._id })
      .populate('schemeId')
      .populate('applicantId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Application has already been submitted.' });
    }

    const scheme = application.schemeId;
    const applicant = application.applicantId;

    // Check if required documents are uploaded
    const docs = await Document.find({ applicationId: application._id });
    const uploadedDocKeys = docs.map(d => d.docKey);

    const missingDocs = (scheme.requiredDocuments || [])
      .filter(d => d.required)
      .filter(d => !uploadedDocKeys.includes(d.key));

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required documents: ${missingDocs.map(d => d.label).join(', ')}. Please upload all mandatory documents before submitting.`,
        missingDocuments: missingDocs
      });
    }

    // Merge context for Rules Engine
    const context = {
      name: applicant.name,
      dob: applicant.profile?.dob,
      gender: applicant.profile?.gender,
      category: applicant.profile?.category || 'ST',
      familyIncome: application.formData?.familyIncome || applicant.profile?.familyIncome,
      marksPercent: application.formData?.marksPercent || applicant.profile?.education?.marksPercent,
      educationLevel: application.formData?.educationLevel || applicant.profile?.education?.level,
      course: application.formData?.course || applicant.profile?.education?.course,
      university: application.formData?.university || applicant.profile?.education?.university,
      country: application.formData?.studyCountry || application.formData?.country,
      disability: applicant.profile?.disability,
      ...application.formData
    };

    // Run Rules Engine
    const evalResult = evaluate(scheme, context);
    application.eligibilityResult = evalResult;
    application.submittedAt = new Date();

    // Determine initial submission state
    const hasUnprocessedDocs = docs.some(d => d.ocrStatus === 'pending');
    const hasNeedsReviewDocs = docs.some(d => d.verificationStatus === 'needs_review');

    if (hasUnprocessedDocs) {
      application.status = 'OCR_PROCESSING';
    } else if (hasNeedsReviewDocs) {
      application.status = 'UNDER_VERIFICATION';
    } else {
      application.status = 'AUTO_VERIFIED';
    }

    application.stageHistory.push({
      stage: 'SUBMITTED',
      by: applicant.name,
      remark: 'Application officially submitted by candidate.'
    });

    application.stageHistory.push({
      stage: application.status,
      by: 'System',
      remark: 'Automated eligibility and OCR verification checks initiated.'
    });

    await application.save();

    // Audit Log
    await AuditLog.create({
      actorId: applicant._id,
      actorName: applicant.name,
      actorRole: 'applicant',
      action: 'SUBMIT_APPLICATION',
      entityType: 'Application',
      entityId: application._id.toString(),
      after: {
        applicationNo: application.applicationNo,
        status: application.status,
        eligibilityPassed: evalResult.passed
      },
      reason: `Application #${application.applicationNo} submitted for ${scheme.code}`,
      ip: req.ip || '127.0.0.1'
    });

    // Notification
    await sendNotification({
      userId: applicant._id,
      type: 'APPLICATION_SUBMITTED',
      templateKey: 'APPLICATION_SUBMITTED',
      templateParams: {
        appNo: application.applicationNo,
        schemeName: scheme.name
      },
      subject: `Application Submitted: ${application.applicationNo}`,
      body: `Your application for ${scheme.name} has been received. Tracking number: ${application.applicationNo}.`,
      link: `/applicant/applications/${application._id}`
    });

    res.json({
      success: true,
      message: 'Application submitted successfully.',
      application
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicantId: req.user._id })
      .populate('schemeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id)
      .populate('schemeId')
      .populate('applicantId', '-passwordHash');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Role security check: applicants can only view their own
    if (req.user.role === 'applicant' && application.applicantId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const documents = await Document.find({ applicationId: id }).sort({ createdAt: 1 });
    const deficiencies = await Deficiency.find({ applicationId: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      application,
      documents,
      deficiencies
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).select('applicationNo status stageHistory createdAt');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    res.json({
      success: true,
      applicationNo: application.applicationNo,
      currentStatus: application.status,
      timeline: application.stageHistory
    });
  } catch (error) {
    next(error);
  }
};
