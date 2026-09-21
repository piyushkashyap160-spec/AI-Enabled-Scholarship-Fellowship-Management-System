import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Application from '../models/Application.js';
import Document from '../models/Document.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');
const scriptPath = path.join(projectRoot, 'ml/scripts/predict_api.py');

/**
 * Canonical mapping helper for document keys
 * Normalizes between camelCase and snake_case (e.g. casteCertificate <-> caste_certificate)
 */
export const normalizeDocKey = (key) => {
  if (!key) return '';
  // Convert camelCase to snake_case
  return key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
};

export const findDocumentByDocKey = (docs = [], targetKey = '') => {
  const targetCanonical = normalizeDocKey(targetKey);
  return docs.find(d => normalizeDocKey(d.docKey) === targetCanonical && d.isCurrent !== false)
    || docs.find(d => normalizeDocKey(d.docKey) === targetCanonical);
};

const getPythonCommand = () => {
  return process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
};

/**
 * Executes Python ML Inference on an application payload
 */
export const runMLPrediction = async (payload) => {
  return new Promise((resolve) => {
    const jsonStr = JSON.stringify(payload);
    const pythonCmd = getPythonCommand();

    execFile(pythonCmd, [scriptPath, jsonStr], { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        console.warn('[ML Service] Python execution unavailable:', stderr || error.message);
        return resolve(fallbackMLInference(payload));
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        parsed.isAvailable = true;
        resolve(parsed);
      } catch (parseErr) {
        console.warn('[ML Service] Parse error on ML output, using non-fabricating fallback:', parseErr.message);
        resolve(fallbackMLInference(payload));
      }
    });
  });
};

/**
 * Predicts ML metrics for a specific DB Application ID
 */
export const predictApplicationById = async (applicationId) => {
  const app = await Application.findById(applicationId)
    .populate('applicantId')
    .populate('schemeId');

  if (!app) {
    throw new Error('Application not found');
  }

  const docs = await Document.find({ applicationId });
  const casteDoc = findDocumentByDocKey(docs, 'caste_certificate');
  const incomeDoc = findDocumentByDocKey(docs, 'income_certificate');
  const marksDoc = findDocumentByDocKey(docs, 'marksheet');

  // Verify true document status using schema values ('done', 'auto_ok', 'approved')
  const isDocVerified = (doc) => {
    if (!doc) return false;
    const isDone = doc.ocrStatus === 'done';
    const isApproved = ['auto_ok', 'approved'].includes(doc.verificationStatus);
    const noCritMismatches = !doc.mismatches || !doc.mismatches.some(m => m.severity === 'critical');
    return isDone && (isApproved || noCritMismatches);
  };

  const payload = {
    scheme_code: app.schemeId?.code || 'ARG45',
    age: app.formData?.age || (app.applicantId?.profile?.dob ? new Date().getFullYear() - new Date(app.applicantId.profile.dob).getFullYear() : 24),
    gender: app.applicantId?.profile?.gender || 'female',
    state: app.applicantId?.profile?.state || 'Jharkhand',
    education_level: app.applicantId?.profile?.education?.level || 'masters',
    marks_percent: Number(app.formData?.marksPercent || app.applicantId?.profile?.education?.marksPercent || 75.0),
    family_income: Number(app.formData?.familyIncome || app.applicantId?.profile?.familyIncome || 250000),
    nirf_rank: 50,
    qs_rank: app.schemeId?.code === 'AZKMI' ? 120 : 999,
    has_admission_offer: true,
    is_pwd: Boolean(app.applicantId?.profile?.disability),
    pwd_percent: Number(app.applicantId?.profile?.disabilityPercent || 0),
    ocr_caste_ok: isDocVerified(casteDoc),
    ocr_income_ok: isDocVerified(incomeDoc),
    ocr_academic_ok: isDocVerified(marksDoc),
    ocr_text_similarity: casteDoc?.confidence ? casteDoc.confidence / 100 : 0.95,
    income_discrepancy_ratio: 1.0,
    marks_discrepancy: 0.0,
    duplicate_cert_count: 1,
    duplicate_bank_count: 1,
    fuzzy_name_match_score: 0.98
  };

  const mlResult = await runMLPrediction(payload);
  return {
    applicationNo: app.applicationNo,
    scheme: app.schemeId?.name,
    applicantName: app.applicantId?.name,
    mlResult
  };
};

/**
 * Transparent Fallback when Python ML service is offline or fails.
 * CRITICAL RULE: Never silently fabricate applicant scores, confidence percentages,
 * or "Auto-Approve" status tags. Clearly indicate that ML is unavailable and that
 * deterministic rule-based verification with human review is required.
 */
export function fallbackMLInference(data) {
  return {
    isAvailable: false,
    message: 'ML analysis unavailable — manual/rule-based verification required.',
    eligibility: {
      decision: 'Requires Review',
      confidence: null,
      status_tag: 'AI Recommendation: Manual Review Required'
    },
    merit_assessment: {
      predicted_merit_score: null,
      estimated_national_percentile: null,
      seat_allocation_prospect: 'Requires Human Scrutiny'
    },
    fraud_risk_assessment: {
      fraud_risk_score: null,
      risk_level: 'Manual Review Required',
      is_statistical_anomaly: false,
      confidence_passed: false
    },
    recommendation: {
      top_scheme_match: data?.scheme_code || 'ARG45',
      reason: 'Rule heuristic evaluation required (ML offline).'
    }
  };
}
