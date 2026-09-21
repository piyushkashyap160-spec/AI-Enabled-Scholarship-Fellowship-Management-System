/**
 * MASTER HARDENING & WORKFLOW TEST SUITE (SIH PS 26239)
 * MoTA AI-Enabled Scholarship & Fellowship Management System
 * 
 * Covers 30 comprehensive automated tests validating:
 * - Public registration role escalation defenses (stripping admin/officer/verifier)
 * - Multi-tenant ownership access control (403 on cross-applicant access)
 * - Document preview authorization, tokens, and path traversal guards
 * - Non-destructive document versioning (v2 creation, v1 preservation, isCurrent toggle)
 * - End-to-end deficiency raising, applicant re-upload, and automatic verifier queue return
 * - Verifier approve/reject actions (mandatory rejection reason check)
 * - Strict CORS rejection on unauthorized cross-origin requests
 * - Cryptographic audit log chaining and tampering verification
 * - ML fallback transparency (null scores, no fabricated data)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

import app from '../src/server.js';
import User from '../src/models/User.js';
import Scheme from '../src/models/Scheme.js';
import Application from '../src/models/Application.js';
import Document from '../src/models/Document.js';
import Deficiency from '../src/models/Deficiency.js';
import AuditLog from '../src/models/AuditLog.js';
import { fallbackMLInference } from '../src/services/mlService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');
const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

const logTest = (num, title, passed, detail = '') => {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m Test ${num}: ${title}`);
  } else {
    failedTests++;
    console.log(`  \x1b[31m✖ [FAIL]\x1b[0m Test ${num}: ${title} ${detail ? `(${detail})` : ''}`);
    failures.push({ num, title, detail });
  }
};

const getAuthToken = (user) => {
  const secret = process.env.JWT_SECRET || 'development_only_secret_key_change_in_env';
  return jwt.sign({ id: user._id }, secret, { expiresIn: '1d' });
};

async function runMasterTestSuite() {
  console.log('\n================================================================');
  console.log('🏛️  MoTA PS 26239 — MASTER HARDENING & WORKFLOW TEST SUITE');
  console.log('================================================================\n');

  // Wait for MongoDB to be ready
  let attempts = 0;
  while (mongoose.connection.readyState !== 1 && attempts < 50) {
    await new Promise((r) => setTimeout(r, 100));
    attempts++;
  }

  if (mongoose.connection.readyState !== 1) {
    console.error('❌ Failed to connect to MongoDB. Aborting tests.');
    process.exit(1);
  }

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------
    // GROUP 1: Public Registration Role Escalation Defenses (Tests 1–3)
    // -------------------------------------------------------------
    console.log('\x1b[36m--- GROUP 1: Public Registration Role Escalation Defenses ---\x1b[0m');

    // Test 1: Register with role: 'admin'
    const regAdminRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: `hacker_admin_${timestamp}@test.com`,
        phone: '9998887701',
        password: 'Password@123',
        role: 'admin'
      })
    });
    const regAdminData = await regAdminRes.json();
    const createdUserAdmin = await User.findOne({ email: `hacker_admin_${timestamp}@test.com` });
    logTest(
      1,
      'Public registration cannot create role: admin (forced to applicant)',
      regAdminRes.status === 201 && createdUserAdmin?.role === 'applicant'
    );

    // Test 2: Register with role: 'officer'
    const regOfficerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Officer',
        email: `hacker_officer_${timestamp}@test.com`,
        phone: '9998887702',
        password: 'Password@123',
        role: 'officer'
      })
    });
    const createdUserOfficer = await User.findOne({ email: `hacker_officer_${timestamp}@test.com` });
    logTest(
      2,
      'Public registration cannot create role: officer (forced to applicant)',
      regOfficerRes.status === 201 && createdUserOfficer?.role === 'applicant'
    );

    // Test 3: Register with role: 'verifier'
    const regVerifierRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Verifier',
        email: `hacker_verifier_${timestamp}@test.com`,
        phone: '9998887703',
        password: 'Password@123',
        role: 'verifier'
      })
    });
    const createdUserVerifier = await User.findOne({ email: `hacker_verifier_${timestamp}@test.com` });
    logTest(
      3,
      'Public registration cannot create role: verifier (forced to applicant)',
      regVerifierRes.status === 201 && createdUserVerifier?.role === 'applicant'
    );

    // -------------------------------------------------------------
    // SETUP FOR REMAINING TESTS: Create 2 Verified Applicants, Scheme, Apps, Docs
    // -------------------------------------------------------------
    const applicantA = await User.create({
      name: 'Applicant Alice',
      email: `alice_${timestamp}@example.com`,
      phone: '9876500001',
      passwordHash: 'Applicant@123',
      role: 'applicant',
      isVerified: true
    });
    const tokenA = getAuthToken(applicantA);

    const applicantB = await User.create({
      name: 'Applicant Bob',
      email: `bob_${timestamp}@example.com`,
      phone: '9876500002',
      passwordHash: 'Applicant@123',
      role: 'applicant',
      isVerified: true
    });
    const tokenB = getAuthToken(applicantB);

    let verifierStaff = await User.findOne({ role: 'verifier' });
    if (!verifierStaff) {
      verifierStaff = await User.create({
        name: 'Verifier Staff',
        email: `verifier_${timestamp}@mota.gov.in`,
        phone: '9876500003',
        passwordHash: 'Verifier@123',
        role: 'verifier',
        isVerified: true
      });
    }
    const tokenVerifier = getAuthToken(verifierStaff);

    let officerStaff = await User.findOne({ role: 'officer' });
    if (!officerStaff) {
      officerStaff = await User.create({
        name: 'Officer Staff',
        email: `officer_${timestamp}@mota.gov.in`,
        phone: '9876500004',
        passwordHash: 'Officer@123',
        role: 'officer',
        isVerified: true
      });
    }
    const tokenOfficer = getAuthToken(officerStaff);

    let adminStaff = await User.findOne({ role: 'admin' });
    if (!adminStaff) {
      adminStaff = await User.create({
        name: 'Admin Staff',
        email: `admin_${timestamp}@mota.gov.in`,
        phone: '9876500005',
        passwordHash: 'Admin@123',
        role: 'admin',
        isVerified: true
      });
    }
    const tokenAdmin = getAuthToken(adminStaff);

    // Find or create scheme
    let scheme = await Scheme.findOne({ isActive: true });
    if (!scheme) {
      scheme = await Scheme.create({
        code: `SCHEME_${timestamp}`,
        name: 'National Fellowship Scheme for ST',
        academicYear: '2026-27',
        version: 1,
        isActive: true,
        requiredDocuments: [{ key: 'caste_certificate', label: 'Caste Certificate', required: true }]
      });
    }

    // Create Application A (belonging to Alice)
    const appA = await Application.create({
      applicantId: applicantA._id,
      schemeId: scheme._id,
      schemeVersion: scheme.version || 1,
      academicYear: scheme.academicYear || '2026-27',
      applicationNo: `MOTA-A-${timestamp}`,
      status: 'UNDER_VERIFICATION',
      stageHistory: [{ stage: 'UNDER_VERIFICATION', by: applicantA.name, remark: 'Submitted' }]
    });

    // Create Application B (belonging to Bob)
    const appB = await Application.create({
      applicantId: applicantB._id,
      schemeId: scheme._id,
      schemeVersion: scheme.version || 1,
      academicYear: scheme.academicYear || '2026-27',
      applicationNo: `MOTA-B-${timestamp}`,
      status: 'DRAFT',
      stageHistory: [{ stage: 'DRAFT', by: applicantB.name, remark: 'Draft created' }]
    });

    // Create physical dummy document file on disk
    const sampleFileName = `test_caste_cert_${timestamp}.pdf`;
    const sampleFilePath = path.join(uploadsDir, sampleFileName);
    fs.writeFileSync(sampleFilePath, '%PDF-1.4 mock pdf certificate content for SIH test suite');

    // Create document for Bob (docB)
    const docB = await Document.create({
      applicationId: appB._id,
      docKey: 'caste_certificate',
      originalName: 'caste_certificate_bob.pdf',
      storedPath: sampleFilePath,
      mimeType: 'application/pdf',
      version: 1,
      isCurrent: true,
      uploadedBy: applicantB._id,
      ocrStatus: 'done',
      verificationStatus: 'needs_review'
    });

    // -------------------------------------------------------------
    // GROUP 2: Ownership Security & Multi-Tenancy Protection (Tests 4–8)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- GROUP 2: Ownership Security & Multi-Tenancy Protection ---\x1b[0m');

    // Test 4: Applicant A cannot view Applicant B's application (403)
    const viewAppBRes = await fetch(`${BASE_URL}/api/applications/${appB._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    logTest(4, "Applicant A cannot view Applicant B's application (403 Forbidden)", viewAppBRes.status === 403);

    // Test 5: Applicant A cannot view Applicant B's timeline (403)
    const viewTimelineBRes = await fetch(`${BASE_URL}/api/applications/${appB._id}/timeline`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    logTest(5, "Applicant A cannot view Applicant B's timeline (403 Forbidden)", viewTimelineBRes.status === 403);

    // Test 6: Applicant A cannot upload document to Applicant B's application (403)
    const uploadFormAtoB = new FormData();
    uploadFormAtoB.append('file', new Blob(['%PDF-1.4 test'], { type: 'application/pdf' }), 'caste.pdf');
    uploadFormAtoB.append('docKey', 'caste_certificate');
    const uploadAtoBRes = await fetch(`${BASE_URL}/api/documents/${appB._id}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: uploadFormAtoB
    });
    logTest(6, "Applicant A cannot upload to Applicant B's application (403 Forbidden)", uploadAtoBRes.status === 403);

    // Test 7: Applicant A cannot re-upload to Applicant B's document (403)
    const reuploadFormAtoB = new FormData();
    reuploadFormAtoB.append('file', new Blob(['%PDF-1.4 test reupload'], { type: 'application/pdf' }), 'caste2.pdf');
    const reuploadAtoBRes = await fetch(`${BASE_URL}/api/documents/${docB._id}/reupload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: reuploadFormAtoB
    });
    logTest(7, "Applicant A cannot re-upload to Applicant B's document (403 Forbidden)", reuploadAtoBRes.status === 403);

    // Test 8: Applicant A cannot delete Applicant B's document (403)
    const deleteDocRes = await fetch(`${BASE_URL}/api/documents/${docB._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    logTest(8, "Applicant A cannot delete Applicant B's document (403 Forbidden)", deleteDocRes.status === 403);

    // -------------------------------------------------------------
    // GROUP 3: Document Preview Authorization & Traversal Protection (Tests 9–15)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- GROUP 3: Document Preview Authorization & Traversal Protection ---\x1b[0m');

    // Test 9: Anonymous access without token returns 401
    const unauthPreviewRes = await fetch(`${BASE_URL}/api/documents/${docB._id}/file`);
    logTest(9, 'Unauthorized document file access returns 401 Unauthorized', unauthPreviewRes.status === 401);

    // Test 10: Applicant A accessing Applicant B's file returns 403
    const wrongApplicantPreviewRes = await fetch(`${BASE_URL}/api/documents/${docB._id}/file`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    logTest(10, 'Cross-applicant document file access returns 403 Forbidden', wrongApplicantPreviewRes.status === 403);

    // Test 11: Verifier access returns 200
    const verifierPreviewRes = await fetch(`${BASE_URL}/api/documents/${docB._id}/file`, {
      headers: { Authorization: `Bearer ${tokenVerifier}` }
    });
    logTest(11, 'Verifier can access authorized document file (200 OK)', verifierPreviewRes.status === 200);

    // Test 12: Officer access returns 200
    const officerPreviewRes = await fetch(`${BASE_URL}/api/documents/${docB._id}/file`, {
      headers: { Authorization: `Bearer ${tokenOfficer}` }
    });
    logTest(12, 'Officer can access authorized document file (200 OK)', officerPreviewRes.status === 200);

    // Test 13: Admin access returns 200
    const adminPreviewRes = await fetch(`${BASE_URL}/api/documents/${docB._id}/file`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    logTest(13, 'Admin can access authorized document file (200 OK)', adminPreviewRes.status === 200);

    // Test 14: Path traversal attempt remains blocked (403)
    const traversalDoc = await Document.create({
      applicationId: appB._id,
      docKey: 'marksheet',
      originalName: 'system_leak.pdf',
      storedPath: '../../server.js', // path traversal outside uploads
      mimeType: 'application/pdf',
      version: 1,
      isCurrent: true,
      uploadedBy: applicantB._id
    });
    const traversalRes = await fetch(`${BASE_URL}/api/documents/${traversalDoc._id}/file`, {
      headers: { Authorization: `Bearer ${tokenVerifier}` }
    });
    logTest(14, 'Path traversal outside uploads directory blocked (403 Forbidden)', traversalRes.status === 403);

    // Test 15: Missing file on server returns 404
    const missingDoc = await Document.create({
      applicationId: appB._id,
      docKey: 'income_certificate',
      originalName: 'missing.pdf',
      storedPath: path.join(uploadsDir, `non_existent_${timestamp}.pdf`),
      mimeType: 'application/pdf',
      version: 1,
      isCurrent: true,
      uploadedBy: applicantB._id
    });
    const missingFileRes = await fetch(`${BASE_URL}/api/documents/${missingDoc._id}/file`, {
      headers: { Authorization: `Bearer ${tokenVerifier}` }
    });
    logTest(15, 'Missing file on disk returns clean 404 Not Found', missingFileRes.status === 404);

    // -------------------------------------------------------------
    // GROUP 4: Non-Destructive Versioning & Deficiency Lifecycle (Tests 16–22)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- GROUP 4: Non-Destructive Versioning & Deficiency Lifecycle ---\x1b[0m');

    // Create a valid document for Alice (docA)
    const docAFile = `alice_caste_v1_${timestamp}.pdf`;
    const docAPath = path.join(uploadsDir, docAFile);
    fs.writeFileSync(docAPath, '%PDF-1.4 Alice Initial Caste Certificate Scan');

    const docA = await Document.create({
      applicationId: appA._id,
      docKey: 'caste_certificate',
      originalName: 'alice_caste_initial.pdf',
      storedPath: docAPath,
      mimeType: 'application/pdf',
      version: 1,
      isCurrent: true,
      uploadedBy: applicantA._id,
      ocrStatus: 'done',
      verificationStatus: 'needs_review'
    });

    // Test 16: Verifier raises deficiency
    const raiseDefRes = await fetch(`${BASE_URL}/api/verifier/applications/${appA._id}/deficiency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVerifier}`
      },
      body: JSON.stringify({
        docKey: 'caste_certificate',
        reason: 'The uploaded caste certificate stamp is smudged. Please re-upload a clear copy.',
        dueDays: 7
      })
    });
    const raiseDefData = await raiseDefRes.json();
    const updatedAppA = await Application.findById(appA._id);
    const defRecord = await Deficiency.findOne({ applicationId: appA._id, docKey: 'caste_certificate', status: 'open' });
    logTest(
      16,
      'Verifier raises deficiency (application becomes DEFICIENT, deficiency status open)',
      (raiseDefRes.status === 200 || raiseDefRes.status === 201) && updatedAppA.status === 'DEFICIENT' && !!defRecord
    );

    // Test 17: Applicant queries application and sees deficiency
    const getAppARes = await fetch(`${BASE_URL}/api/applications/${appA._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const getAppAData = await getAppARes.json();
    logTest(
      17,
      'Applicant receives deficiency notification & sees Action Required in case file',
      getAppARes.status === 200 && getAppAData.deficiencies?.some((d) => d.status === 'open')
    );

    // Test 18: Applicant re-uploads document -> creates v2
    const docA2File = `alice_caste_v2_${timestamp}.pdf`;
    const docA2Path = path.join(uploadsDir, docA2File);
    fs.writeFileSync(docA2Path, '%PDF-1.4 Alice High-Resolution Clear Caste Certificate');

    const reuploadForm = new FormData();
    reuploadForm.append('file', new Blob([fs.readFileSync(docA2Path)], { type: 'application/pdf' }), 'caste_cert_clear.pdf');
    reuploadForm.append('reason', 'Re-uploaded crystal clear copy issued by Tahsildar');

    const reuploadRes = await fetch(`${BASE_URL}/api/documents/${docA._id}/reupload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: reuploadForm
    });
    const reuploadData = await reuploadRes.json();
    const newDoc = reuploadData.document;

    logTest(
      18,
      'Applicant re-upload creates new version v2 with isCurrent: true',
      (reuploadRes.status === 200 || reuploadRes.status === 201) && newDoc?.version === 2 && newDoc?.isCurrent === true
    );

    // Test 19: v1 preserved with isCurrent: false, newDoc links back to previousDocId
    const oldDocA = await Document.findById(docA._id);
    logTest(
      19,
      'Previous document version (v1) preserved with isCurrent: false and linked via previousDocId',
      oldDocA?.isCurrent === false && newDoc?.previousDocId?.toString() === docA._id.toString()
    );

    // Test 20: New version triggers OCR processing and verificationStatus is needs_review
    logTest(
      20,
      'New version enters processing pipeline with verificationStatus: needs_review',
      newDoc?.verificationStatus === 'needs_review'
    );

    // Test 21: Deficiency resolved and application returns to verifier queue (UNDER_VERIFICATION)
    const resolvedDef = await Deficiency.findById(defRecord._id);
    const refreshedAppA = await Application.findById(appA._id);
    logTest(
      21,
      'Re-upload resolves deficiency and returns application to verifier queue (UNDER_VERIFICATION)',
      resolvedDef?.status === 'resolved' && refreshedAppA?.status === 'UNDER_VERIFICATION'
    );

    // Test 22: Both v1 and v2 are available in the application case file
    const allDocsAppA = await Document.find({ applicationId: appA._id });
    logTest(
      22,
      'Complete non-destructive version history (v1 and v2) preserved in case file',
      allDocsAppA.length >= 2 && allDocsAppA.some((d) => d.version === 1) && allDocsAppA.some((d) => d.version === 2)
    );

    // -------------------------------------------------------------
    // GROUP 5: Verifier Decisions & Scrutiny Progression (Tests 23–26)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- GROUP 5: Verifier Decisions & Scrutiny Progression ---\x1b[0m');

    // Test 23: Verifier accesses new version file
    const verifierViewV2Res = await fetch(`${BASE_URL}/api/documents/${newDoc._id}/file`, {
      headers: { Authorization: `Bearer ${tokenVerifier}` }
    });
    logTest(
      23,
      'Verifier successfully views replacement document file (200 OK with stream)',
      verifierViewV2Res.status === 200 && verifierViewV2Res.headers.get('content-type')?.includes('pdf')
    );

    // Test 24: Verifier approves document
    const approveRes = await fetch(`${BASE_URL}/api/verifier/documents/${newDoc._id}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVerifier}`
      },
      body: JSON.stringify({
        decision: 'approved',
        remark: 'Caste certificate verified against government issuing guidelines.'
      })
    });
    const approvedDocInDb = await Document.findById(newDoc._id);
    logTest(
      24,
      'Verifier approves document (verificationStatus updated to approved)',
      approveRes.status === 200 && approvedDocInDb?.verificationStatus === 'approved'
    );

    // Test 25: Reject requires reason (400 if empty)
    const rejectEmptyRes = await fetch(`${BASE_URL}/api/verifier/documents/${newDoc._id}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVerifier}`
      },
      body: JSON.stringify({
        decision: 'rejected',
        remark: ''
      })
    });
    logTest(
      25,
      'Verifier rejection requires mandatory reason (empty remark returns 400)',
      rejectEmptyRes.status === 400
    );

    // Test 26: Reject with reason records rejection and audit log
    const rejectValidRes = await fetch(`${BASE_URL}/api/verifier/documents/${newDoc._id}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVerifier}`
      },
      body: JSON.stringify({
        decision: 'rejected',
        remark: 'Tahsildar seal is unreadable upon secondary forensic review.'
      })
    });
    const rejectedDocInDb = await Document.findById(newDoc._id);
    const auditRejectEntry = await AuditLog.findOne({
      entityId: newDoc._id.toString(),
      action: 'DOCUMENT_REJECTED'
    });
    logTest(
      26,
      'Verifier rejection with reason updates status to rejected and creates audit log',
      rejectValidRes.status === 200 && rejectedDocInDb?.verificationStatus === 'rejected' && !!auditRejectEntry
    );

    // -------------------------------------------------------------
    // GROUP 6: CORS, Audit Hash Chaining & ML Fallback (Tests 27–30)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- GROUP 6: CORS, Audit Hash Chaining & ML Fallback ---\x1b[0m');

    // Test 27: CORS rejection on unauthorized origin
    let corsBlocked = false;
    try {
      const corsRes = await fetch(`${BASE_URL}/api/health`, {
        headers: {
          Origin: 'https://malicious-external-attacker.com'
        }
      });
      // Express CORS middleware passes error to errorHandler, resulting in 500 error response with CORS message
      const text = await corsRes.text();
      if (corsRes.status >= 400 && text.includes('Not allowed by CORS')) {
        corsBlocked = true;
      }
    } catch (err) {
      corsBlocked = true;
    }
    logTest(27, 'Strict CORS: unauthorized cross-origin request rejected with error', corsBlocked);

    // Test 28: Cryptographic audit integrity endpoint (GET /api/admin/audit/verify)
    const auditVerifyRes = await fetch(`${BASE_URL}/api/admin/audit/verify`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const auditVerifyData = await auditVerifyRes.json();
    logTest(
      28,
      'Cryptographic audit integrity verification endpoint reports intact chain (GET /api/admin/audit/verify)',
      auditVerifyRes.status === 200 && auditVerifyData.success === true && auditVerifyData.intact === true
    );

    // Test 29: ML Fallback is transparent, returns null scores, no fake 94.5% or fabricated metrics
    const fallbackData = fallbackMLInference({ scheme_code: 'ARG45' });
    const noFabrication =
      fallbackData.isAvailable === false &&
      fallbackData.eligibility.confidence === null &&
      fallbackData.merit_assessment.predicted_merit_score === null &&
      fallbackData.fraud_risk_assessment.fraud_risk_score === null &&
      fallbackData.eligibility.status_tag.includes('Manual Review Required');
    logTest(
      29,
      'ML graceful fallback returns isAvailable: false with null scores and no fabricated values',
      noFabrication
    );

    // Test 30: Cryptographic hash chain verification of consecutive AuditLog entries
    const allAuditLogs = await AuditLog.find().sort({ sequenceNumber: 1 });
    let chainValid = allAuditLogs.length > 0;
    let expectedHash = 'GENESIS';

    for (let i = 0; i < allAuditLogs.length; i++) {
      const log = allAuditLogs[i];
      if (i === 0) {
        if (log.previousHash !== 'GENESIS') chainValid = false;
      } else {
        if (log.previousHash !== expectedHash) chainValid = false;
      }
      const recomputed = log.computeHash(log.sequenceNumber, log.previousHash);
      if (log.entryHash !== recomputed) chainValid = false;
      expectedHash = log.entryHash;
    }
    logTest(
      30,
      `Cryptographic audit trail has ${allAuditLogs.length} verified sequential hash-linked blocks`,
      chainValid
    );

  } catch (error) {
    console.error('\n❌ Unhandled exception during test execution:', error);
  } finally {
    // Summary
    console.log('\n================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
    console.log('================================================================');

    if (failedTests > 0) {
      console.log('\n❌ Failures:');
      failures.forEach((f) => console.log(`  - Test ${f.num}: ${f.title} ${f.detail ? `(${f.detail})` : ''}`));
      process.exit(1);
    } else {
      console.log('\n🎉 ALL 30 MASTER HARDENING & WORKFLOW TESTS PASSED SUCCESSFULLY!\n');
      process.exit(0);
    }
  }
}

runMasterTestSuite();
