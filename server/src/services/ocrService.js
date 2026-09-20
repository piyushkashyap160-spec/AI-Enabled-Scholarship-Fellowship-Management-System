import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import Document from '../models/Document.js';
import Application from '../models/Application.js';
import Deficiency from '../models/Deficiency.js';
import VerificationLog from '../models/VerificationLog.js';
import { sendNotification } from './notificationService.js';

/**
 * Compute SHA-256 hash of a file
 */
export const calculateFileHash = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (error) {
    console.error(`[File Hash Error]: ${error.message}`);
    return '';
  }
};

/**
 * Fuzzy name comparison: normalizes spaces, casing, punctuation, and honorifics.
 */
export const fuzzyNameMatch = (nameA, nameB) => {
  if (!nameA || !nameB) return false;
  const clean = (s) => s.toLowerCase()
    .replace(/^(mr\.|mrs\.|ms\.|shri|smt|dr\.)\s+/i, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const strA = clean(String(nameA));
  const strB = clean(String(nameB));

  if (strA === strB) return true;
  if (strA.includes(strB) || strB.includes(strA)) return true;

  // Compare token sets (e.g., "Rahul Kumar" vs "Kumar Rahul")
  const tokensA = strA.split(' ').sort().join(' ');
  const tokensB = strB.split(' ').sort().join(' ');
  if (tokensA === tokensB) return true;

  // Simple Levenshtein distance check for small typos
  const distance = levenshtein(strA, strB);
  const maxLen = Math.max(strA.length, strB.length);
  return (distance / maxLen) < 0.25; // 75%+ similarity
};

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Format a snake_case key into Title Case
 */
export const formatDocLabel = (key) => {
  if (!key || typeof key !== 'string') return '';
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const DOC_TYPE_SIGNATURES = {
  caste_certificate: {
    strong: ['scheduled tribe', 'caste certificate', 'tribe certificate', 'constitution (scheduled tribes)', 'sub-divisional magistrate'],
    weak: ['tehsildar', 'tahsildar']
  },
  income_certificate: {
    strong: ['income certificate', 'annual income', 'gross income', 'family income'],
    weak: ['revenue officer', 'tahsildar']
  },
  marksheet: {
    strong: ['statement of marks', 'grade sheet', 'marksheet', 'controller of examinations', 'marks obtained'],
    weak: ['cgpa', 'semester', 'percentage']
  },
  offer_letter: {
    strong: ['offer letter', 'admission offer', 'letter of acceptance', 'conditional offer', 'unconditional offer'],
    weak: ['university', 'faculty of', 'tuition fee']
  },
  bank_passbook: {
    strong: ['passbook', 'bank statement', 'ifsc', 'saving bank'],
    weak: ['account number', 'branch code', 'bank of']
  },
  aadhaar: {
    strong: ['aadhaar', 'unique identification authority of india', 'uidai', 'mera aadhaar'],
    weak: ['enrolment no']
  },
  college_id: {
    strong: ['student id', 'college id', 'library card'],
    weak: ['identity card', 'valid upto', 'roll no:']
  }
};

/**
 * Classify document type based on keyword signatures in extracted text
 */
export const classifyDocumentType = (rawText) => {
  if (!rawText || rawText.trim().length < 40) {
    return { type: 'unknown', confidence: 0, matchedKeywords: [] };
  }
  const text = rawText.toLowerCase();

  const scores = {};
  const matched = {};

  for (const [docType, sig] of Object.entries(DOC_TYPE_SIGNATURES)) {
    let score = 0;
    const matches = [];

    for (const kw of sig.strong) {
      if (text.includes(kw.toLowerCase())) {
        score += 3;
        matches.push(kw);
      }
    }

    for (const kw of sig.weak) {
      if (text.includes(kw.toLowerCase())) {
        score += 1;
        matches.push(kw);
      }
    }

    scores[docType] = score;
    matched[docType] = matches;
  }

  let topDoc = 'unknown';
  let topScore = 0;
  let runnerUpScore = 0;

  for (const [docType, score] of Object.entries(scores)) {
    if (score > topScore) {
      runnerUpScore = topScore;
      topScore = score;
      topDoc = docType;
    } else if (score > runnerUpScore) {
      runnerUpScore = score;
    }
  }

  // Require minimum total score of 6 and lead over runner-up of at least 3
  if (topScore < 6 || (topScore - runnerUpScore) < 3) {
    return { type: 'unknown', confidence: 0, matchedKeywords: [] };
  }

  const confidence = Math.min(97, Math.round(55 + (topScore - 6) * 8));

  return {
    type: topDoc,
    confidence,
    matchedKeywords: matched[topDoc] || []
  };
};

/**
 * Extract structured fields based on docKey and regex patterns
 */
export const extractFieldsByDocType = (docKey, rawText) => {
  const extracted = {};
  if (!rawText) return extracted;

  switch (docKey) {
    case 'caste_certificate': {
      // Certificate number
      const certNoMatch = rawText.match(/(?:certificate\s*(?:no|number)|cert\s*no|ref\s*no|application\s*no)[:\s.]+([A-Z0-9\/-]+)/i);
      if (certNoMatch) extracted.certificate_no = certNoMatch[1].trim();

      // Category
      if (/scheduled\s*tribe|category\s*[:\s]*st\b|\bST\b/i.test(rawText)) {
        extracted.category = 'Scheduled Tribe (ST)';
      }

      // Issuing authority
      const authMatch = rawText.match(/(Tehsildar|Tahsildar|Sub-Divisional Magistrate|SDM|District Magistrate|Revenue Officer|Competent Authority)/i);
      if (authMatch) extracted.issuing_authority = authMatch[1].trim();

      // Date of issue
      const dateMatch = rawText.match(/(?:date\s*(?:of\s*issue)?|dated)[:\s.]+([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:20|19)\d{2})/i);
      if (dateMatch) extracted.issue_date = dateMatch[1].trim();

      // Holder name
      const nameMatch = rawText.match(/(?:this\s*is\s*to\s*certify\s*that|certified\s*that|shri|smt|kumari|name\s*[:])\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/);
      if (nameMatch) extracted.holder_name = nameMatch[1].trim();
      break;
    }

    case 'income_certificate': {
      // Income extraction (supports ₹, Rs., digits, and words like Lakh)
      const numMatch = rawText.match(/(?:annual\s*income|family\s*income|income\s*is|rs\.?|₹)\s*[:\s]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]{4,8})/i);
      if (numMatch) {
        const rawNum = numMatch[1].replace(/,/g, '');
        const val = parseFloat(rawNum);
        if (!isNaN(val) && val > 1000) {
          extracted.annual_income = val;
        }
      }

      // Check lakh words e.g. "4.5 Lakh" or "Four Lakh Fifty Thousand"
      const lakhMatch = rawText.match(/([0-9]+(?:\.[0-9]+)?)\s*lakh/i);
      if (lakhMatch && !extracted.annual_income) {
        extracted.annual_income = parseFloat(lakhMatch[1]) * 100000;
      }

      // Issue date
      const dateMatch = rawText.match(/(?:date\s*(?:of\s*issue)?|dated)[:\s.]+([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:20|19)\d{2})/i);
      if (dateMatch) extracted.issue_date = dateMatch[1].trim();

      // Issuing authority
      const authMatch = rawText.match(/(Tehsildar|Tahsildar|Revenue Divisional Officer|District Collector|Taluk Executive)/i);
      if (authMatch) extracted.issuing_authority = authMatch[1].trim();

      // Holder name
      const nameMatch = rawText.match(/(?:certify\s*that|shri|smt|kumari|name\s*[:])\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/);
      if (nameMatch) extracted.holder_name = nameMatch[1].trim();
      break;
    }

    case 'marksheet': {
      // Percentage
      const percentMatch = rawText.match(/(?:percentage|aggregate|marks\s*obtained|total\s*%|percent)[:\s.]+([0-9]{2}(?:\.[0-9]{1,2})?)\s*%/i);
      if (percentMatch) {
        extracted.percentage = parseFloat(percentMatch[1]);
      } else {
        const cgpaMatch = rawText.match(/(?:cgpa|gpa|sgpa|ogpa)[:\s.]+([0-9](?:\.[0-9]{1,2})?)/i);
        if (cgpaMatch) {
          const cgpa = parseFloat(cgpaMatch[1]);
          extracted.cgpa = cgpa;
          extracted.percentage = parseFloat((cgpa * 9.5).toFixed(2)); // Standard conversion
        }
      }

      // Roll number
      const rollMatch = rawText.match(/(?:roll\s*no|registration\s*no|enrolment\s*no)[:\s.]+([A-Z0-9\/-]+)/i);
      if (rollMatch) extracted.roll_number = rollMatch[1].trim();

      // Passing Year
      const yearMatch = rawText.match(/(?:year\s*(?:of\s*passing)?|passed\s*in|session)[:\s.]+(20\d{2}|19\d{2})/i);
      if (yearMatch) extracted.year_of_passing = parseInt(yearMatch[1], 10);

      // University
      const uniMatch = rawText.match(/(University\s+of\s+[A-Za-z\s]+|[A-Za-z\s]+University|[A-Za-z\s]+Institute\s+of\s+Technology|[A-Za-z\s]+College)/i);
      if (uniMatch) extracted.university = uniMatch[1].trim();
      break;
    }

    case 'offer_letter': {
      // University / Institution
      const uniMatch = rawText.match(/(University\s+of\s+[A-Za-z\s]+|[A-Za-z\s]+University|Imperial\s+College|Harvard\s+University|Oxford\s+University|Cambridge\s+University|University\s+of\s+Melbourne|Australian\s+National\s+University)/i);
      if (uniMatch) extracted.university = uniMatch[1].trim();

      // Country
      const countryMatch = rawText.match(/\b(United Kingdom|UK|United States|USA|Australia|Canada|Germany|New Zealand|Singapore|Sweden)\b/i);
      if (countryMatch) extracted.country = countryMatch[1].trim();

      // Programme
      const progMatch = rawText.match(/(?:programme|course|degree|admission\s*to)[:\s.]+([A-Za-z\s]+(?:in\s+[A-Za-z\s]+)?)/i);
      if (progMatch) extracted.programme = progMatch[1].trim();

      // Start date
      const dateMatch = rawText.match(/(?:commencement|start\s*date|intake)[:\s.]+([A-Za-z0-9\s,\/\-]+(?:20\d{2}))/i);
      if (dateMatch) extracted.start_date = dateMatch[1].trim();
      break;
    }

    case 'bank_passbook': {
      // Account number (Masked)
      const accMatch = rawText.match(/(?:account\s*(?:no|number)|a\/c\s*no)[:\s.]+([0-9]{8,18})/i);
      if (accMatch) {
        const rawAcc = accMatch[1].trim();
        const masked = `XXXX-XXXX-${rawAcc.slice(-4)}`;
        extracted.account_no = masked;
        extracted.raw_last4 = rawAcc.slice(-4);
      }

      // IFSC code
      const ifscMatch = rawText.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/i);
      if (ifscMatch) extracted.ifsc = ifscMatch[1].toUpperCase();

      // Holder name
      const nameMatch = rawText.match(/(?:account\s*holder|name|held\s*by)[:\s.]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i);
      if (nameMatch) extracted.holder_name = nameMatch[1].trim();
      break;
    }

    case 'aadhaar': {
      // Aadhaar last 4 digits (MANDATORY: mask all first 8 digits)
      const aadhaarMatch = rawText.match(/(\d{4}\s*\d{4}\s*\d{4}|\d{12})/);
      if (aadhaarMatch) {
        const rawDigits = aadhaarMatch[1].replace(/\s+/g, '');
        extracted.aadhaar_masked = `XXXX-XXXX-${rawDigits.slice(-4)}`;
        extracted.aadhaarLast4 = rawDigits.slice(-4);
      }
      break;
    }

    default:
      break;
  }

  return extracted;
};

/**
 * Perform OCR Extraction on a file (PDF or Image)
 */
export const performOCR = async (filePath, docKey) => {
  const ext = path.extname(filePath).toLowerCase();
  let rawText = '';
  let confidence = 85; // baseline confidence

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text || '';
      // If PDF has embedded text, confidence is high
      confidence = rawText.trim().length > 50 ? 94 : 70;
    } else if (['.jpg', '.jpeg', '.png', '.bmp', '.webp'].includes(ext)) {
      // Use tesseract worker for OCR
      const worker = await createWorker('eng');
      const ret = await worker.recognize(filePath);
      rawText = ret.data.text || '';
      confidence = Math.round(ret.data.confidence || 85);
      await worker.terminate();
    } else {
      // Fallback for text files or mock files
      rawText = fs.readFileSync(filePath, 'utf-8');
      confidence = 90;
    }
  } catch (error) {
    console.warn(`[OCR Engine Warning]: Direct extraction failed (${error.message}). Attempting fallback reader.`);
    try {
      rawText = fs.readFileSync(filePath, 'utf-8');
      confidence = 75;
    } catch {
      rawText = '';
      confidence = 0;
    }
  }

  const classification = classifyDocumentType(rawText);
  const extracted = extractFieldsByDocType(docKey, rawText);

  return {
    rawText,
    confidence,                                          // OCR LEGIBILITY only - unrelated to classification
    detectedDocType: classification.type,
    classificationConfidence: classification.confidence, // confidence in the type guess itself
    matchedKeywords: classification.matchedKeywords,
    extracted
  };
};

/**
 * Cross check extracted OCR data with applicant's declared profile and application formData
 */
export const compareDataAndDetectMismatches = (docKey, declaredData, extractedData, detectedDocType, maxAgeMonths = 0, classificationConfidence = 0) => {
  const mismatches = [];

  const CONFIDENT_MISMATCH_THRESHOLD = 65;

  // 1. Document Type Classification mismatch check
  if (detectedDocType === 'unknown') {
    mismatches.push({
      field: 'document_type',
      declared: formatDocLabel(docKey),
      extracted: 'Unrecognized',
      severity: 'warning',
      message: `The document type could not be confidently identified from the uploaded file. An officer will manually confirm this is the correct ${formatDocLabel(docKey)}.`
    });
  } else if (detectedDocType !== docKey) {
    const severity = classificationConfidence >= CONFIDENT_MISMATCH_THRESHOLD ? 'critical' : 'warning';
    const message = classificationConfidence >= CONFIDENT_MISMATCH_THRESHOLD
      ? `Uploaded file appears to be a ${formatDocLabel(detectedDocType)}, not a ${formatDocLabel(docKey)}. Please upload the correct document.`
      : `Uploaded file may be a ${formatDocLabel(detectedDocType)} rather than a ${formatDocLabel(docKey)}, but this match is low-confidence (${classificationConfidence}%). An officer will manually verify.`;
    mismatches.push({ field: 'document_type', declared: formatDocLabel(docKey), extracted: formatDocLabel(detectedDocType), severity, message });
  }

  // 2. Name check
  if (extractedData.holder_name && declaredData.name) {
    const match = fuzzyNameMatch(declaredData.name, extractedData.holder_name);
    if (!match) {
      mismatches.push({
        field: 'holder_name',
        declared: declaredData.name,
        extracted: extractedData.holder_name,
        severity: 'critical',
        message: `Name mismatch: Application says "${declaredData.name}" but document shows "${extractedData.holder_name}".`
      });
    }
  }

  // 3. Category check (for caste_certificate)
  if (docKey === 'caste_certificate' && extractedData.category) {
    const isST = /scheduled\s*tribe|\bST\b/i.test(extractedData.category);
    if (!isST) {
      mismatches.push({
        field: 'category',
        declared: declaredData.category || 'ST',
        extracted: extractedData.category,
        severity: 'critical',
        message: `Certificate indicates "${extractedData.category}" instead of Scheduled Tribe (ST).`
      });
    }
  }

  // 4. Income check
  if (docKey === 'income_certificate' && extractedData.annual_income !== undefined && declaredData.familyIncome !== undefined) {
    const declaredInc = Number(declaredData.familyIncome);
    const extractedInc = Number(extractedData.annual_income);
    // Allow small margin of tolerance
    if (Math.abs(declaredInc - extractedInc) > 1000) {
      const formatCurr = (v) => `₹${Number(v).toLocaleString('en-IN')}`;
      mismatches.push({
        field: 'familyIncome',
        declared: formatCurr(declaredInc),
        extracted: formatCurr(extractedInc),
        severity: 'warning',
        message: `Declared income (${formatCurr(declaredInc)}) differs from certificate income (${formatCurr(extractedInc)}).`
      });
    }
  }

  // 5. Marksheet marks check
  if (docKey === 'marksheet' && extractedData.percentage !== undefined && declaredData.marksPercent !== undefined) {
    const declaredMarks = Number(declaredData.marksPercent);
    const extractedMarks = Number(extractedData.percentage);
    if (Math.abs(declaredMarks - extractedMarks) > 2) {
      mismatches.push({
        field: 'marksPercent',
        declared: `${declaredMarks}%`,
        extracted: `${extractedMarks}%`,
        severity: 'warning',
        message: `Entered marks (${declaredMarks}%) differ from marksheet percentage (${extractedMarks}%).`
      });
    }
  }

  // 6. Bank Account check
  if (docKey === 'bank_passbook' && extractedData.raw_last4 && declaredData.bankAccount) {
    const declaredLast4 = String(declaredData.bankAccount).slice(-4);
    if (declaredLast4 !== extractedData.raw_last4) {
      mismatches.push({
        field: 'bankAccount',
        declared: `Ending in ${declaredLast4}`,
        extracted: `Ending in ${extractedData.raw_last4}`,
        severity: 'critical',
        message: `Bank account ending in ${declaredLast4} does not match passbook account ending in ${extractedData.raw_last4}.`
      });
    }
  }

  // 7. Aadhaar last 4 check
  if (docKey === 'aadhaar' && extractedData.aadhaarLast4 && declaredData.aadhaarLast4) {
    if (String(declaredData.aadhaarLast4).trim() !== String(extractedData.aadhaarLast4).trim()) {
      mismatches.push({
        field: 'aadhaarLast4',
        declared: declaredData.aadhaarLast4,
        extracted: extractedData.aadhaarLast4,
        severity: 'critical',
        message: `Aadhaar last 4 digits (${declaredData.aadhaarLast4}) do not match uploaded card (${extractedData.aadhaarLast4}).`
      });
    }
  }

  // 8. Document Expiry Check (maxAgeMonths)
  if (maxAgeMonths > 0 && extractedData.issue_date) {
    try {
      const parts = extractedData.issue_date.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const issueDate = new Date(year, month, day);
        const diffMonths = (new Date() - issueDate) / (1000 * 60 * 60 * 24 * 30.4375);
        if (diffMonths > maxAgeMonths) {
          mismatches.push({
            field: 'issue_date',
            declared: `Valid within ${maxAgeMonths} months`,
            extracted: extractedData.issue_date,
            severity: 'critical',
            message: `Document issued on ${extractedData.issue_date} is older than the allowed validity of ${maxAgeMonths} months.`
          });
        }
      }
    } catch {
      // Ignore date parse errors
    }
  }

  return mismatches;
};

/**
 * Asynchronous document processing pipeline
 */
export const processDocumentAsync = async (documentId) => {
  try {
    const doc = await Document.findById(documentId).populate({
      path: 'applicationId',
      populate: [{ path: 'applicantId' }, { path: 'schemeId' }]
    });

    if (!doc || !doc.applicationId) return;

    const application = doc.applicationId;
    const applicant = application.applicantId;
    const scheme = application.schemeId;

    // Find scheme requirement configuration for this docKey
    const reqDocConfig = scheme?.requiredDocuments?.find(d => d.key === doc.docKey) || {};
    const maxAgeMonths = reqDocConfig.maxAgeMonths || 0;

    // 1. Calculate File Hash for SHA-256 integrity & fraud check
    const sha256 = calculateFileHash(doc.storedPath);
    doc.sha256 = sha256;

    // 2. Perform OCR extraction
    const ocrResult = await performOCR(doc.storedPath, doc.docKey);
    doc.ocrRawText = ocrResult.rawText;
    doc.confidence = ocrResult.confidence;
    doc.detectedDocType = ocrResult.detectedDocType;
    doc.classificationConfidence = ocrResult.classificationConfidence;
    doc.matchedKeywords = ocrResult.matchedKeywords || [];
    doc.ocrExtracted = ocrResult.extracted;
    doc.ocrStatus = 'done';

    // 3. Merged declared dataset
    const declaredData = {
      name: applicant.name,
      category: applicant.profile?.category || 'ST',
      familyIncome: application.formData?.familyIncome || applicant.profile?.familyIncome,
      marksPercent: application.formData?.marksPercent || applicant.profile?.education?.marksPercent,
      bankAccount: application.formData?.bankAccount || applicant.profile?.bankAccount,
      aadhaarLast4: application.formData?.aadhaarLast4 || applicant.profile?.aadhaarLast4,
      ...application.formData
    };

    // 4. Compare & detect mismatches
    const mismatches = compareDataAndDetectMismatches(
      doc.docKey,
      declaredData,
      ocrResult.extracted,
      ocrResult.detectedDocType,
      maxAgeMonths,
      ocrResult.classificationConfidence
    );

    // 5. Confidence check (< 60 implies unreadable)
    if (ocrResult.confidence < 60) {
      mismatches.push({
        field: 'clarity',
        declared: 'Clear scan required',
        extracted: `OCR confidence: ${ocrResult.confidence}%`,
        severity: 'critical',
        message: 'The uploaded document is blurry or unreadable. Please upload a clear, high-resolution scan.'
      });
    }

    doc.mismatches = mismatches;

    // Determine verification status
    const positivelyConfirmed = ocrResult.detectedDocType === doc.docKey;
    if (mismatches.length === 0 && ocrResult.confidence >= 75 && positivelyConfirmed) {
      doc.verificationStatus = 'auto_ok';
    } else {
      doc.verificationStatus = 'needs_review';
    }

    await doc.save();

    // 6. Record Verification Log
    await VerificationLog.create({
      documentId: doc._id,
      applicationId: application._id,
      action: 'OCR_ANALYSIS_COMPLETED',
      actorType: 'AI_OCR',
      actorName: 'AI OCR Engine',
      details: {
        confidence: doc.confidence,
        detectedType: doc.detectedDocType,
        classificationConfidence: doc.classificationConfidence,
        matchedKeywords: doc.matchedKeywords,
        extracted: doc.ocrExtracted,
        mismatchesCount: mismatches.length,
        status: doc.verificationStatus
      }
    });

    // 7. Auto-raise deficiency if critical mismatches or unreadable
    const criticalMismatches = mismatches.filter(m => m.severity === 'critical');
    if (criticalMismatches.length > 0) {
      const reason = criticalMismatches.map(m => m.message).join('; ');
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // 7 days grace period

      const deficiency = await Deficiency.create({
        applicationId: application._id,
        docKey: doc.docKey,
        reason,
        raisedBy: 'AI_OCR_ENGINE',
        dueDate,
        status: 'open'
      });

      // Update Application stage to DEFICIENT
      application.status = 'DEFICIENT';
      application.stageHistory.push({
        stage: 'DEFICIENT',
        by: 'AI OCR Engine',
        remark: `Deficiency raised for ${doc.docKey}: ${reason}`
      });
      await application.save();

      // Send deficiency notification
      await sendNotification({
        userId: applicant._id,
        type: 'DEFICIENCY_RAISED',
        subject: `Deficiency Notice: Action Required for ${reqDocConfig.label || doc.docKey}`,
        body: `Your uploaded ${reqDocConfig.label || doc.docKey} requires correction: ${reason}. Please re-upload within 7 days.`,
        link: `/applicant/deficiencies`
      });
    } else {
      // Check if all required documents for the application are uploaded and verified
      const allDocs = await Document.find({ applicationId: application._id });
      const reqKeys = scheme?.requiredDocuments?.map(d => d.key) || [];
      const uploadedKeys = allDocs.map(d => d.docKey);
      const allUploaded = reqKeys.every(k => uploadedKeys.includes(k));

      if (allUploaded && application.status === 'OCR_PROCESSING') {
        const hasNeedsReview = allDocs.some(d => d.verificationStatus === 'needs_review');
        application.status = hasNeedsReview ? 'UNDER_VERIFICATION' : 'AUTO_VERIFIED';
        application.stageHistory.push({
          stage: application.status,
          by: 'AI OCR Engine',
          remark: hasNeedsReview
            ? 'All documents processed; flagged items queued for Verifier review.'
            : 'All documents auto-verified with high confidence.'
        });
        await application.save();
      }
    }
  } catch (error) {
    console.error(`[Process Document Async Error]: ${error.message}`);
  }
};
