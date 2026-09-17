import Document from '../models/Document.js';
import Application from '../models/Application.js';
import User from '../models/User.js';

/**
 * Anomaly and duplicate detection service for SIH PS 26239.
 * Purpose: Flags irregularities for human officer scrutiny.
 * Standard wording: "Anomaly detected, manual verification required."
 */
export const detectSystemAnomalies = async () => {
  const anomalies = [];

  // 1. Identical SHA-256 File Hashes across different applications
  const docsWithHash = await Document.aggregate([
    { $match: { sha256: { $exists: true, $ne: '' } } },
    {
      $group: {
        _id: '$sha256',
        count: { $sum: 1 },
        docIds: { $push: '$_id' },
        appIds: { $push: '$applicationId' },
        docKeys: { $push: '$docKey' },
        fileNames: { $push: '$originalName' }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  for (const item of docsWithHash) {
    // Check if duplicate hash exists across DIFFERENT applications
    const uniqueAppIds = [...new Set(item.appIds.map(id => id?.toString()))];
    if (uniqueAppIds.length > 1) {
      const apps = await Application.find({ _id: { $in: uniqueAppIds } }).populate('applicantId');
      anomalies.push({
        type: 'DUPLICATE_FILE_HASH',
        severity: 'critical',
        title: 'Identical File Uploaded Across Multiple Applications',
        description: 'The exact same binary file (identical SHA-256 checksum) was uploaded in multiple independent applications.',
        actionRequired: 'Anomaly detected, manual verification required.',
        details: {
          sha256: item._id,
          duplicateCount: item.count,
          affectedApplications: apps.map(a => ({
            applicationNo: a.applicationNo,
            applicantName: a.applicantId?.name || 'Unknown',
            email: a.applicantId?.email
          }))
        },
        detectedAt: new Date()
      });
    }
  }

  // 2. Duplicate Certificate Number in OCR Extracted data
  const docsWithCertNo = await Document.aggregate([
    { $match: { 'ocrExtracted.certificate_no': { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$ocrExtracted.certificate_no',
        count: { $sum: 1 },
        docIds: { $push: '$_id' },
        appIds: { $push: '$applicationId' }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  for (const item of docsWithCertNo) {
    const uniqueAppIds = [...new Set(item.appIds.map(id => id?.toString()))];
    if (uniqueAppIds.length > 1) {
      const apps = await Application.find({ _id: { $in: uniqueAppIds } }).populate('applicantId');
      anomalies.push({
        type: 'DUPLICATE_CERTIFICATE_NUMBER',
        severity: 'critical',
        title: 'Same Certificate Number Extracted from Multiple Documents',
        description: `Certificate number "${item._id}" was extracted via OCR across multiple applicant files.`,
        actionRequired: 'Anomaly detected, manual verification required.',
        details: {
          certificateNo: item._id,
          affectedApplications: apps.map(a => ({
            applicationNo: a.applicationNo,
            applicantName: a.applicantId?.name || 'Unknown',
            email: a.applicantId?.email
          }))
        },
        detectedAt: new Date()
      });
    }
  }

  // 3. Duplicate Bank Account across multiple applicants
  const bankAccDuplicates = await User.aggregate([
    { $match: { 'profile.bankAccount': { $exists: true, $ne: null, $ne: '' } } },
    {
      $group: {
        _id: '$profile.bankAccount',
        count: { $sum: 1 },
        userIds: { $push: '$_id' },
        names: { $push: '$name' },
        emails: { $push: '$email' }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  for (const item of bankAccDuplicates) {
    const masked = `XXXX-XXXX-${String(item._id).slice(-4)}`;
    anomalies.push({
      type: 'DUPLICATE_BANK_ACCOUNT',
      severity: 'warning',
      title: 'Shared Bank Account Number Detected',
      description: `Bank account ending in ${String(item._id).slice(-4)} is registered under ${item.count} different applicant accounts.`,
      actionRequired: 'Anomaly detected, manual verification required.',
      details: {
        accountMasked: masked,
        registeredUsers: item.names.map((name, i) => ({
          name,
          email: item.emails[i]
        }))
      },
      detectedAt: new Date()
    });
  }

  // 4. Same Aadhaar last 4 + Name similarity across different user accounts
  const aadhaarDuplicates = await User.aggregate([
    { $match: { 'profile.aadhaarLast4': { $exists: true, $ne: null, $ne: '' } } },
    {
      $group: {
        _id: '$profile.aadhaarLast4',
        count: { $sum: 1 },
        userIds: { $push: '$_id' },
        names: { $push: '$name' },
        emails: { $push: '$email' }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  for (const item of aadhaarDuplicates) {
    // Check if names among same aadhaarLast4 are identical
    const uniqueNames = [...new Set(item.names.map(n => n.toLowerCase().trim()))];
    if (uniqueNames.length < item.count) {
      anomalies.push({
        type: 'DUPLICATE_AADHAAR_NAME',
        severity: 'critical',
        title: 'Duplicate Aadhaar (Last 4) & Name Across Accounts',
        description: `Multiple user registrations exist with the same name and Aadhaar last-4 digits (${item._id}).`,
        actionRequired: 'Anomaly detected, manual verification required.',
        details: {
          aadhaarLast4: item._id,
          accounts: item.names.map((name, i) => ({
            name,
            email: item.emails[i]
          }))
        },
        detectedAt: new Date()
      });
    }
  }

  return anomalies;
};
