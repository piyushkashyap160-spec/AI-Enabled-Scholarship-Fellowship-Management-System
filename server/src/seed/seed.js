import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Scheme from '../models/Scheme.js';
import Application from '../models/Application.js';
import Document from '../models/Document.js';
import Deficiency from '../models/Deficiency.js';
import VerificationLog from '../models/VerificationLog.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import Disbursement from '../models/Disbursement.js';
import { calculateFileHash } from '../services/ocrService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplesDir = path.join(__dirname, '../../uploads/samples');

if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// Generate sample mock documents for offline OCR demonstrations
const generateSampleFiles = () => {
  console.log('[Seed]: Generating sample certificates for offline OCR demo...');

  const casteCertContent = `GOVERNMENT OF JHARKHAND
OFFICE OF THE SUB-DIVISIONAL MAGISTRATE, RANCHI
CASTE CERTIFICATE
Certificate Number: ST/JH/2023/8892
Date of Issue: 15/08/2023
This is to certify that Rahul Kumar, Son of Shri Birsa Kumar, residing at Khunti, District Ranchi, Jharkhand belongs to the Munda Community which is recognized as a Scheduled Tribe (ST) under the Constitution (Scheduled Tribes) Order, 1950.
Issuing Authority: Sub-Divisional Magistrate
Digital Signature Verified`;

  const incomeCertContent = `GOVERNMENT OF JHARKHAND
OFFICE OF THE TAHSILDAR, REVENUE DIVISION RANCHI
INCOME CERTIFICATE
Certificate No: INC/2025/4412
Dated: 10/01/2025
This is to certify that the Annual Family Income of Shri Rahul Kumar, residing at Village Murhu, District Khunti, from all sources is Rs. 3,00,000 (Rupees Three Lakh Only).
Issuing Authority: Tahsildar`;

  const incomeMismatchContent = `GOVERNMENT OF ODISHA
OFFICE OF THE REVENUE OFFICER, MAYURBHANJ
ANNUAL INCOME CERTIFICATE
Certificate No: INC/OD/2024/9912
Date of Issue: 12/03/2024
This is to certify that family gross annual income of Kum. Sunita Soren from all sources is Rs. 4,50,000 (Rupees Four Lakh Fifty Thousand Only).
Issuing Authority: Tahsildar`;

  const idCardWrongSlotContent = `ST. XAVIER'S COLLEGE (AUTONOMOUS)
STUDENT IDENTITY CARD
Name: Rahul Kumar
Roll No: 21BCS049
Course: B.Sc. Computer Science
Valid Upto: June 2026
Library Card No: LIB-9941
Issuing Authority: Dean of Student Affairs`;

  const nameMismatchContent = `GOVERNMENT OF MADHYA PRADESH
OFFICE OF THE TEHSILDAR, MANDLA
SCHEDULED TRIBE CERTIFICATE
Certificate Number: ST/MP/2023/1102
Date of Issue: 20/09/2023
Certified that Rohan Kumar Son of Shri Mohan Kumar belongs to the Gond Community which is recognized as a Scheduled Tribe (ST).
Issuing Authority: Tehsildar`;

  const marksheetContent = `RANCHI UNIVERSITY, JHARKHAND
STATEMENT OF MARKS
Degree: Master of Science in Biotechnology
Name: Rahul Kumar
Roll Number: RU/2024/BIO/042
Year of Passing: 2024
Percentage: 74.50%
CGPA: 7.84
Controller of Examinations
University of Ranchi`;

  const offerLetterContent = `UNIVERSITY OF OXFORD
FACULTY OF COMPUTER SCIENCE, UNITED KINGDOM
UNCONDITIONAL OFFER LETTER
Date: 12/02/2026
Dear Rahul Kumar,
We are pleased to offer you unconditional admission to the Degree of Master of Science in Advanced Computer Science at the University of Oxford, United Kingdom for the Academic Session commencing October 2026.
Tuition Fee: £34,500 per annum
Director of International Admissions`;

  const passbookContent = `STATE BANK OF INDIA
SAVINGS BANK PASSBOOK
Account Number: 39847192841
Account Holder: Rahul Kumar
IFSC: SBIN0001234
Branch: Ranchi Main Branch, Jharkhand
Account Type: Resident Savings Bank`;

  const aadhaarContent = `GOVERNMENT OF INDIA
UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI)
MERA AADHAAR, MERI PEHCHAN
Name: Rahul Kumar
DOB: 12/05/1999
Gender: Male
Aadhaar Number: 9812 4432 4892
Enrolment No: 1029/39481/10293`;

  // Write sample text files
  fs.writeFileSync(path.join(samplesDir, 'caste_certificate_correct.txt'), casteCertContent);
  fs.writeFileSync(path.join(samplesDir, 'income_certificate_correct.txt'), incomeCertContent);
  fs.writeFileSync(path.join(samplesDir, 'income_certificate_mismatch.txt'), incomeMismatchContent);
  fs.writeFileSync(path.join(samplesDir, 'college_id_card_wrong.txt'), idCardWrongSlotContent);
  fs.writeFileSync(path.join(samplesDir, 'caste_certificate_name_mismatch.txt'), nameMismatchContent);
  fs.writeFileSync(path.join(samplesDir, 'marksheet_correct.txt'), marksheetContent);
  fs.writeFileSync(path.join(samplesDir, 'offer_letter_oxford.txt'), offerLetterContent);
  fs.writeFileSync(path.join(samplesDir, 'bank_passbook_correct.txt'), passbookContent);
  fs.writeFileSync(path.join(samplesDir, 'aadhaar_correct.txt'), aadhaarContent);
};

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sih_scholarship';
    console.log(`[Seed]: Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed]: Connected to MongoDB. Clearing existing collections...');
    await User.deleteMany({});
    await Scheme.deleteMany({});
    await Application.deleteMany({});
    await Document.deleteMany({});
    await Deficiency.deleteMany({});
    await VerificationLog.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    await Disbursement.deleteMany({});

    generateSampleFiles();

    // 1. Create Staff Users (Admin, Verifiers, Officers)
    const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
    const passwordHashVerifier = await bcrypt.hash('Verifier@123', 10);
    const passwordHashOfficer = await bcrypt.hash('Officer@123', 10);
    const passwordHashApplicant = await bcrypt.hash('Applicant@123', 10);

    const admin = await User.create({
      name: 'Dr. Arjun Munda (Ministry Director)',
      email: 'admin@mota.gov.in',
      phone: '9876543210',
      passwordHash: passwordHashAdmin,
      role: 'admin',
      isVerified: true,
      preferredLanguage: 'en'
    });

    const verifier1 = await User.create({
      name: 'Sunita Meena (Senior Verifier)',
      email: 'verifier1@mota.gov.in',
      phone: '9876543211',
      passwordHash: passwordHashVerifier,
      role: 'verifier',
      isVerified: true,
      preferredLanguage: 'en'
    });

    const verifier2 = await User.create({
      name: 'Rajesh Gond (Verification Officer)',
      email: 'verifier2@mota.gov.in',
      phone: '9876543212',
      passwordHash: passwordHashVerifier,
      role: 'verifier',
      isVerified: true,
      preferredLanguage: 'hi'
    });

    const officer1 = await User.create({
      name: 'Pooja Marandi (Joint Commissioner)',
      email: 'officer1@mota.gov.in',
      phone: '9876543213',
      passwordHash: passwordHashOfficer,
      role: 'officer',
      isVerified: true,
      preferredLanguage: 'en'
    });

    const officer2 = await User.create({
      name: 'Anil Oraon (Scrutiny Director)',
      email: 'officer2@mota.gov.in',
      phone: '9876543214',
      passwordHash: passwordHashOfficer,
      role: 'officer',
      isVerified: true,
      preferredLanguage: 'hi'
    });

    // 2. Create 25 Realistic ST Applicants across India
    const stApplicantsData = [
      { name: 'Rahul Kumar', email: 'rahul.st@example.com', phone: '9811001001', state: 'Jharkhand', district: 'Khunti', gender: 'male', dob: new Date('1999-05-12'), level: 'masters', course: 'M.Sc. Biotechnology', university: 'Ranchi University', marksPercent: 74.5, familyIncome: 300000, bankAccount: '39847192841', ifsc: 'SBIN0001234', aadhaarLast4: '4892' },
      { name: 'Sunita Soren', email: 'sunita.soren@example.com', phone: '9811001002', state: 'Odisha', district: 'Mayurbhanj', gender: 'female', dob: new Date('2000-08-22'), level: 'phd', course: 'Ph.D. Environmental Science', university: 'Utkal University', marksPercent: 82.0, familyIncome: 450000, bankAccount: '11029482910', ifsc: 'PUNB0123456', aadhaarLast4: '7712' },
      { name: 'Birsa Tirkey', email: 'birsa.tirkey@example.com', phone: '9811001003', state: 'Chhattisgarh', district: 'Bastar', gender: 'male', dob: new Date('1998-03-15'), level: 'masters', course: 'M.Tech AI & Data Science', university: 'NIT Raipur', marksPercent: 78.4, familyIncome: 250000, bankAccount: '20194829104', ifsc: 'BARB0BASTAR', aadhaarLast4: '8834' },
      { name: 'Meena Hembram', email: 'meena.hembram@example.com', phone: '9811001004', state: 'West Bengal', district: 'Purulia', gender: 'female', dob: new Date('2001-01-10'), level: 'phd', course: 'Ph.D. Tribal Linguistics', university: 'Jadavpur University', marksPercent: 85.2, familyIncome: 380000, bankAccount: '44910293810', ifsc: 'UTBI0PUR452', aadhaarLast4: '1923' },
      { name: 'Rohan Markam', email: 'rohan.markam@example.com', phone: '9811001005', state: 'Madhya Pradesh', district: 'Mandla', gender: 'male', dob: new Date('1997-11-04'), level: 'masters', course: 'M.Sc. Forestry', university: 'Indira Gandhi National Tribal University', marksPercent: 68.0, familyIncome: 180000, bankAccount: '99018273612', ifsc: 'CBIN0283741', aadhaarLast4: '3341' },
      { name: 'Anjali Kerketta', email: 'anjali.kerketta@example.com', phone: '9811001006', state: 'Jharkhand', district: 'Simdega', gender: 'female', dob: new Date('1999-09-18'), level: 'masters', course: 'M.A. Development Studies', university: 'TISS', marksPercent: 79.5, familyIncome: 420000, bankAccount: '55610293847', ifsc: 'SBIN0004921', aadhaarLast4: '6623' },
      { name: 'Amit Boro', email: 'amit.boro@example.com', phone: '9811001007', state: 'Assam', district: 'Kokrajhar', gender: 'male', dob: new Date('2000-04-30'), level: 'phd', course: 'Ph.D. Renewable Energy', university: 'Gauhati University', marksPercent: 81.0, familyIncome: 500000, bankAccount: '33910294821', ifsc: 'SBIN0008472', aadhaarLast4: '9921' },
      { name: 'Kavita Maravi', email: 'kavita.maravi@example.com', phone: '9811001008', state: 'Madhya Pradesh', district: 'Dindori', gender: 'female', dob: new Date('2001-07-14'), level: 'masters', course: 'M.Sc. Microbiology', university: 'DAVV Indore', marksPercent: 73.2, familyIncome: 220000, bankAccount: '88102938471', ifsc: 'BKID0009281', aadhaarLast4: '4451' },
      { name: 'Deepak Dungdung', email: 'deepak.dungdung@example.com', phone: '9811001009', state: 'Odisha', district: 'Sundargarh', gender: 'male', dob: new Date('1998-12-01'), level: 'phd', course: 'Ph.D. Metallurgical Engg', university: 'NIT Rourkela', marksPercent: 88.6, familyIncome: 600000, bankAccount: '77291048291', ifsc: 'SBIN0007291', aadhaarLast4: '2283' },
      { name: 'Priya Jamatia', email: 'priya.jamatia@example.com', phone: '9811001010', state: 'Tripura', district: 'Gomati', gender: 'female', dob: new Date('2000-02-17'), level: 'masters', course: 'M.Sc. Botany', university: 'Tripura University', marksPercent: 76.8, familyIncome: 310000, bankAccount: '11928471920', ifsc: 'UTBI0AGR102', aadhaarLast4: '9942' },
      { name: 'Sanjay Bhagat', email: 'sanjay.bhagat@example.com', phone: '9811001011', state: 'Jharkhand', district: 'Gumla', gender: 'male', dob: new Date('1996-06-25'), level: 'phd', course: 'Ph.D. Sociology', university: 'JNU New Delhi', marksPercent: 84.0, familyIncome: 350000, bankAccount: '66291038472', ifsc: 'SBIN0001029', aadhaarLast4: '5512' },
      { name: 'Ritu Khasi', email: 'ritu.khasi@example.com', phone: '9811001012', state: 'Meghalaya', district: 'East Khasi Hills', gender: 'female', dob: new Date('2001-10-09'), level: 'masters', course: 'M.A. English Literature', university: 'NEHU Shillong', marksPercent: 77.0, familyIncome: 480000, bankAccount: '33491029481', ifsc: 'SBIN0003921', aadhaarLast4: '7731' },
      { name: 'Kishore Naik', email: 'kishore.naik@example.com', phone: '9811001013', state: 'Andhra Pradesh', district: 'Visakhapatnam', gender: 'male', dob: new Date('1999-03-21'), level: 'masters', course: 'M.Tech Cyber Security', university: 'Andhra University', marksPercent: 71.5, familyIncome: 290000, bankAccount: '99201948291', ifsc: 'ANDB0001928', aadhaarLast4: '4821' },
      { name: 'Lalitha Rathod', email: 'lalitha.rathod@example.com', phone: '9811001014', state: 'Telangana', district: 'Adilabad', gender: 'female', dob: new Date('2000-12-19'), level: 'masters', course: 'M.Sc. Organic Chemistry', university: 'Osmania University', marksPercent: 86.4, familyIncome: 340000, bankAccount: '88291038471', ifsc: 'SBIN0009182', aadhaarLast4: '3391' },
      { name: 'Vikram Gamit', email: 'vikram.gamit@example.com', phone: '9811001015', state: 'Gujarat', district: 'Tapi', gender: 'male', dob: new Date('1997-08-11'), level: 'phd', course: 'Ph.D. Agronomy', university: 'Navsari Agricultural University', marksPercent: 79.0, familyIncome: 410000, bankAccount: '44102938472', ifsc: 'BARB0VYTAPI', aadhaarLast4: '6612' },
      { name: 'Shanti Munda', email: 'shanti.munda@example.com', phone: '9811001016', state: 'Jharkhand', district: 'Ranchi', gender: 'female', dob: new Date('2002-04-05'), level: 'masters', course: 'M.Sc. Physics', university: 'BIT Mesra', marksPercent: 89.2, familyIncome: 370000, bankAccount: '22910293841', ifsc: 'SBIN0004910', aadhaarLast4: '8823', disability: true },
      { name: 'Manoj Rabha', email: 'manoj.rabha@example.com', phone: '9811001017', state: 'Assam', district: 'Goalpara', gender: 'male', dob: new Date('1998-07-28'), level: 'phd', course: 'Ph.D. Zoology', university: 'Tezpur University', marksPercent: 75.0, familyIncome: 460000, bankAccount: '77102938472', ifsc: 'SBIN0006281', aadhaarLast4: '1192' },
      { name: 'Pooja Bhil', email: 'pooja.bhil@example.com', phone: '9811001018', state: 'Rajasthan', district: 'Banswara', gender: 'female', dob: new Date('2001-05-16'), level: 'masters', course: 'M.A. Economics', university: 'MLSU Udaipur', marksPercent: 80.5, familyIncome: 260000, bankAccount: '55102938471', ifsc: 'SBBJ0001928', aadhaarLast4: '5582' },
      { name: 'Naresh Koya', email: 'naresh.koya@example.com', phone: '9811001019', state: 'Andhra Pradesh', district: 'Alluri Sitharama Raju', gender: 'male', dob: new Date('1999-11-23'), level: 'masters', course: 'M.Tech Power Systems', university: 'JNTU Kakinada', marksPercent: 70.0, familyIncome: 390000, bankAccount: '66102938471', ifsc: 'SBIN0008819', aadhaarLast4: '7721' },
      { name: 'Sarita Baiga', email: 'sarita.baiga@example.com', phone: '9811001020', state: 'Madhya Pradesh', district: 'Balaghat', gender: 'female', dob: new Date('2000-09-02'), level: 'phd', course: 'Ph.D. Ethnobotany', university: 'Jabalpur University', marksPercent: 83.5, familyIncome: 190000, bankAccount: '99102938472', ifsc: 'UBIN0539281', aadhaarLast4: '3312', pvtg: true },
      { name: 'Tarun Lepcha', email: 'tarun.lepcha@example.com', phone: '9811001021', state: 'Sikkim', district: 'North Sikkim', gender: 'male', dob: new Date('1997-02-14'), level: 'phd', course: 'Ph.D. Glaciology & Climate', university: 'Sikkim University', marksPercent: 87.0, familyIncome: 520000, bankAccount: '11920394821', ifsc: 'SBIN0009921', aadhaarLast4: '4491' },
      { name: 'Anita Murmu', email: 'anita.murmu@example.com', phone: '9811001022', state: 'Jharkhand', district: 'Dumka', gender: 'female', dob: new Date('2001-03-31'), level: 'masters', course: 'M.Sc. Mathematics', university: 'SKMU Dumka', marksPercent: 78.0, familyIncome: 280000, bankAccount: '88391029384', ifsc: 'ALLA0210928', aadhaarLast4: '6641' },
      { name: 'Ganesh Korwa', email: 'ganesh.korwa@example.com', phone: '9811001023', state: 'Chhattisgarh', district: 'Surguja', gender: 'male', dob: new Date('1998-10-17'), level: 'masters', course: 'M.Sc. Geology', university: 'Guru Ghasidas University', marksPercent: 72.8, familyIncome: 210000, bankAccount: '33102948291', ifsc: 'SBIN0005910', aadhaarLast4: '8891', pvtg: true },
      { name: 'Varsha Saharia', email: 'varsha.saharia@example.com', phone: '9811001024', state: 'Madhya Pradesh', district: 'Sheopur', gender: 'female', dob: new Date('2000-06-18'), level: 'phd', course: 'Ph.D. Public Health', university: 'AIIMS Bhopal', marksPercent: 91.0, familyIncome: 240000, bankAccount: '77201938472', ifsc: 'SBIN0007812', aadhaarLast4: '2219', pvtg: true },
      { name: 'Hemant Bheel', email: 'hemant.bheel@example.com', phone: '9811001025', state: 'Gujarat', district: 'Dahod', gender: 'male', dob: new Date('1999-01-29'), level: 'masters', course: 'M.Tech Civil Engg', university: 'SVNIT Surat', marksPercent: 69.4, familyIncome: 950000, bankAccount: '44291029381', ifsc: 'SBIN0001928', aadhaarLast4: '9901' } // Exceeds income limit (deliberate demo case)
    ];

    const createdApplicants = [];
    for (const appData of stApplicantsData) {
      const user = await User.create({
        name: appData.name,
        email: appData.email,
        phone: appData.phone,
        passwordHash: passwordHashApplicant,
        role: 'applicant',
        isVerified: true,
        preferredLanguage: 'en',
        profile: {
          dob: appData.dob,
          gender: appData.gender,
          category: 'ST',
          state: appData.state,
          district: appData.district,
          disability: Boolean(appData.disability),
          aadhaarLast4: appData.aadhaarLast4,
          education: {
            level: appData.level,
            course: appData.course,
            university: appData.university,
            marksPercent: appData.marksPercent,
            yearOfPassing: 2024
          },
          familyIncome: appData.familyIncome,
          bankAccount: appData.bankAccount,
          ifsc: appData.ifsc,
          pvtg: Boolean(appData.pvtg)
        }
      });
      createdApplicants.push(user);
    }

    // 3. Create All 5 Official MoTA Schemes (from tribal.nic.in & dbttribal.gov.in)
    const openDate = new Date();
    openDate.setDate(openDate.getDate() - 30);
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 30);

    const nfstScheme = await Scheme.create({
      code: 'ARG45',
      name: 'National Fellowship for ST Students (NFST)',
      description: 'Central Sector Scheme providing financial fellowship to Scheduled Tribe students pursuing M.Phil and Ph.D. research programmes in Indian Universities, IITs, NITs, and National Institutes across Sciences, Humanities, and Engineering.',
      level: 'phd',
      schemeType: 'Central Sector Scheme',
      benefitType: 'In Cash (DBT Monthly Stipend)',
      category: 'National Research Fellowship',
      isActive: true,
      openDate,
      closeDate,
      totalSeats: 750,
      stipendAmountPerYear: 384000, // Rs. 32,000/month JRF
      formFields: [
        { key: 'researchTopic', label: 'Proposed Research Topic / Thesis Title', type: 'text', required: true, helpText: 'Enter your research specialization or synopsis title' },
        { key: 'university', label: 'Indian University / Institute of National Importance', type: 'text', required: true },
        { key: 'course', label: 'Degree Programme', type: 'select', options: ['Ph.D. Full Time', 'Integrated Ph.D.', 'M.Phil + Ph.D.'], required: true },
        { key: 'marksPercent', label: 'Postgraduate Aggregate Percentage', type: 'number', required: true },
        { key: 'entranceScore', label: 'UGC-NET / CSIR / GATE Score', type: 'number', required: false, helpText: 'Enter percentile or qualifying score if applicable' },
        { key: 'familyIncome', label: 'Total Annual Family Income (INR)', type: 'number', required: true },
        { key: 'researchGuide', label: 'Supervisor / Guide Name & Designation', type: 'text', required: true }
      ],
      requiredDocuments: [
        { key: 'caste_certificate', label: 'ST Community / Tribe Certificate', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['certificate_no', 'issue_date', 'category', 'holder_name'], required: true },
        { key: 'income_certificate', label: 'Competent Authority Income Certificate', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 12, ocrFields: ['annual_income', 'issue_date', 'issuing_authority'], required: true },
        { key: 'marksheet', label: 'Master\'s / Qualifying Degree Marksheet', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['percentage', 'roll_number', 'university', 'year_of_passing'], required: true },
        { key: 'aadhaar', label: 'Aadhaar Card (Proof of Identity)', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['aadhaarLast4'], required: true },
        { key: 'bank_passbook', label: 'Bank Account Passbook / Cancelled Cheque', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['account_no', 'ifsc', 'holder_name'], required: true }
      ],
      eligibilityRules: [
        { field: 'category', operator: 'equals', value: 'ST', message: 'Applicant must belong to a Scheduled Tribe (ST)' },
        { field: 'familyIncome', operator: 'lte', value: 800000, message: 'Total annual family income must not exceed Rs 8,00,000' },
        { field: 'marksPercent', operator: 'gte', value: 55, message: 'Minimum 55% aggregate marks required in Master degree' },
        { field: 'age', operator: 'lte', value: 36, message: 'Maximum age limit is 36 years as of closing date' },
        { field: 'educationLevel', operator: 'in', value: ['masters', 'phd'], message: 'Open to candidates who have completed Masters or enrolled in PhD' }
      ],
      meritWeights: {
        marksPercent: 0.50,
        entranceScore: 0.30,
        interviewScore: 0.20
      },
      reservationQuota: {
        female: 0.30,
        disability: 0.04,
        pvtg: 0.05
      }
    });

    const nosScheme = await Scheme.create({
      code: 'AZKMI',
      name: 'National Overseas Scholarship for ST Students (NOS)',
      description: 'Central Sector Scheme providing financial assistance to selected Scheduled Tribe students for pursuing Master\'s, Ph.D., and Post-Doctoral research programmes in recognized foreign Universities/Institutions abroad in Top 500 QS/THE World Rankings.',
      level: 'masters',
      schemeType: 'Central Sector Scheme',
      benefitType: 'In Cash (Tuition Fee + Living Allowance Abroad)',
      category: 'International Overseas Scholarship',
      isActive: true,
      openDate,
      closeDate,
      totalSeats: 100,
      stipendAmountPerYear: 1800000, // ~18L annual tuition & stipend support abroad
      formFields: [
        { key: 'studyCountry', label: 'Destination Country', type: 'select', options: ['United Kingdom', 'United States', 'Australia', 'Canada', 'Germany', 'Singapore', 'New Zealand'], required: true },
        { key: 'foreignUniversity', label: 'Foreign University / Institution Name', type: 'text', required: true },
        { key: 'course', label: 'Overseas Degree Programme', type: 'text', required: true },
        { key: 'admissionStatus', label: 'Admission Offer Type', type: 'select', options: ['Unconditional Offer', 'Conditional Offer'], required: true },
        { key: 'marksPercent', label: 'Qualifying Bachelor\'s / Master\'s Percentage', type: 'number', required: true },
        { key: 'greGmatScore', label: 'GRE / GMAT / IELTS / TOEFL Score', type: 'number', required: false },
        { key: 'familyIncome', label: 'Total Annual Family Income (INR)', type: 'number', required: true }
      ],
      requiredDocuments: [
        { key: 'caste_certificate', label: 'ST Community / Tribe Certificate', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['certificate_no', 'issue_date', 'category', 'holder_name'], required: true },
        { key: 'income_certificate', label: 'Income Certificate (Valid for Current Year)', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 12, ocrFields: ['annual_income', 'issue_date', 'issuing_authority'], required: true },
        { key: 'offer_letter', label: 'Foreign University Unconditional/Conditional Offer Letter', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['university', 'country', 'programme', 'start_date'], required: true },
        { key: 'marksheet', label: 'Qualifying Degree Marksheet', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['percentage', 'university', 'year_of_passing'], required: true },
        { key: 'aadhaar', label: 'Aadhaar Card Copy', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['aadhaarLast4'], required: true },
        { key: 'bank_passbook', label: 'Bank Account Passbook Copy', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['account_no', 'ifsc', 'holder_name'], required: true }
      ],
      eligibilityRules: [
        { field: 'category', operator: 'equals', value: 'ST', message: 'Applicant must belong to a Scheduled Tribe' },
        { field: 'familyIncome', operator: 'lte', value: 600000, message: 'Family income must not exceed Rs 6,00,000 per annum' },
        { field: 'marksPercent', operator: 'gte', value: 55, message: 'Minimum 55% marks or equivalent grade required in qualifying degree' },
        { field: 'age', operator: 'lte', value: 35, message: 'Maximum age 35 years as of 1st July of selection year' },
        { field: 'educationLevel', operator: 'in', value: ['bachelors', 'masters', 'phd'], message: 'Open to Masters and PhD overseas programmes only' }
      ],
      meritWeights: {
        marksPercent: 0.50,
        entranceScore: 0.30,
        interviewScore: 0.20
      },
      reservationQuota: {
        female: 0.30,
        disability: 0.04,
        pvtg: 0.05
      }
    });

    const topClassScheme = await Scheme.create({
      code: 'A023B',
      name: 'Top Class Education for ST Students',
      description: 'Central Sector Scheme providing full institute tuition fee reimbursement, living allowance (Rs. 3,000/month), and a one-time computer grant (Rs. 45,000) to ST students admitted into 265+ notified premier institutions (IITs, IIMs, AIIMS, NITs, NLUs).',
      level: 'undergraduate',
      schemeType: 'Central Sector Scheme',
      benefitType: 'In Cash (Full Institute Fees + Living Allowance + Hardware Grant)',
      category: 'Premier Institution Scholarship',
      isActive: true,
      openDate,
      closeDate,
      totalSeats: 1000,
      stipendAmountPerYear: 320000,
      formFields: [
        { key: 'university', label: 'Notified Premier Institution (IIT/IIM/NIT/AIIMS)', type: 'text', required: true },
        { key: 'course', label: 'Degree Programme (B.Tech / MBBS / MBA / LLB / B.Des)', type: 'text', required: true },
        { key: 'marksPercent', label: 'Qualifying 12th / Degree Aggregate Percentage', type: 'number', required: true },
        { key: 'entranceScore', label: 'JEE / NEET / CAT / CLAT Rank Score', type: 'number', required: false },
        { key: 'familyIncome', label: 'Total Annual Family Income (INR)', type: 'number', required: true }
      ],
      requiredDocuments: [
        { key: 'caste_certificate', label: 'ST Community / Tribe Certificate', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['certificate_no', 'issue_date', 'category', 'holder_name'], required: true },
        { key: 'income_certificate', label: 'Income Certificate (Valid for Current Year)', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 12, ocrFields: ['annual_income', 'issue_date', 'issuing_authority'], required: true },
        { key: 'marksheet', label: 'Class 12th / Qualifying Marksheet', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['percentage', 'roll_number', 'university', 'year_of_passing'], required: true },
        { key: 'aadhaar', label: 'Aadhaar Card Copy', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['aadhaarLast4'], required: true },
        { key: 'bank_passbook', label: 'Bank Account Passbook Copy', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['account_no', 'ifsc', 'holder_name'], required: true }
      ],
      eligibilityRules: [
        { field: 'category', operator: 'equals', value: 'ST', message: 'Applicant must belong to Scheduled Tribe (ST)' },
        { field: 'familyIncome', operator: 'lte', value: 600000, message: 'Family income must not exceed Rs 6,00,000 per annum' },
        { field: 'marksPercent', operator: 'gte', value: 55, message: 'Minimum 55% aggregate marks required in qualifying examination' },
        { field: 'educationLevel', operator: 'in', value: ['12th', 'bachelors', 'masters', 'undergraduate'], message: 'Enrolled in 265+ notified premier institutions' }
      ],
      meritWeights: { marksPercent: 0.60, entranceScore: 0.40 },
      reservationQuota: { female: 0.30, disability: 0.05, pvtg: 0.05 }
    });

    const postMatricScheme = await Scheme.create({
      code: 'BVOBC',
      name: 'Post-Matric Scholarship Scheme for ST Students',
      description: 'Centrally Sponsored Scheme delivered via Direct Benefit Transfer (DBT) to provide financial assistance to Scheduled Tribe students studying at post-matriculation or post-secondary stages (Classes 11th, 12th, ITI, Diploma, Undergraduate and Postgraduate courses).',
      level: 'higher_secondary',
      schemeType: 'Centrally Sponsored Scheme',
      benefitType: 'In Cash (DBT Maintenance Allowance & Compulsory Fees)',
      category: 'Centrally Sponsored Post-Matric',
      isActive: true,
      openDate,
      closeDate,
      totalSeats: 50000,
      stipendAmountPerYear: 35000,
      formFields: [
        { key: 'university', label: 'College / University / Polytechnic Institute Name', type: 'text', required: true },
        { key: 'course', label: 'Degree / Diploma / Class Programme', type: 'text', required: true },
        { key: 'marksPercent', label: 'Previous Class Passing Aggregate Percentage', type: 'number', required: true },
        { key: 'familyIncome', label: 'Total Annual Family Income (INR)', type: 'number', required: true }
      ],
      requiredDocuments: [
        { key: 'caste_certificate', label: 'ST Community / Tribe Certificate', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['certificate_no', 'issue_date', 'category', 'holder_name'], required: true },
        { key: 'income_certificate', label: 'Income Certificate (Family income <= 2.5 Lakhs)', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 12, ocrFields: ['annual_income', 'issue_date', 'issuing_authority'], required: true },
        { key: 'marksheet', label: 'Previous Class Qualifying Marksheet', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['percentage', 'roll_number', 'university', 'year_of_passing'], required: true },
        { key: 'aadhaar', label: 'Aadhaar Card Copy', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['aadhaarLast4'], required: true },
        { key: 'bank_passbook', label: 'Bank Account Passbook Copy', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['account_no', 'ifsc', 'holder_name'], required: true }
      ],
      eligibilityRules: [
        { field: 'category', operator: 'equals', value: 'ST', message: 'Applicant must belong to Scheduled Tribe (ST)' },
        { field: 'familyIncome', operator: 'lte', value: 250000, message: 'Family income must not exceed Rs 2,50,000 per annum' },
        { field: 'marksPercent', operator: 'gte', value: 45, message: 'Must have passed previous annual examination' }
      ],
      meritWeights: { marksPercent: 0.80, entranceScore: 0.20 },
      reservationQuota: { female: 0.30, disability: 0.05, pvtg: 0.05 }
    });

    const preMatricScheme = await Scheme.create({
      code: 'BPVGK',
      name: 'Pre-Matric Scholarship Scheme for ST Students (Class IX & X)',
      description: 'Centrally Sponsored Scheme to support ST students studying in Classes IX and X in Government or recognized schools to minimize transition drop-out rates, with direct cash benefits for day scholars and hostellers.',
      level: '10th',
      schemeType: 'Centrally Sponsored Scheme',
      benefitType: 'In Cash (DBT School Allowance & Book Grant)',
      category: 'Centrally Sponsored Pre-Matric',
      isActive: true,
      openDate,
      closeDate,
      totalSeats: 100000,
      stipendAmountPerYear: 7000,
      formFields: [
        { key: 'university', label: 'School Name & District', type: 'text', required: true },
        { key: 'course', label: 'Current Class (Class IX / Class X)', type: 'select', options: ['Class IX', 'Class X'], required: true },
        { key: 'marksPercent', label: 'Previous Class Passing Aggregate Percentage', type: 'number', required: true },
        { key: 'familyIncome', label: 'Total Annual Family Income (INR)', type: 'number', required: true }
      ],
      requiredDocuments: [
        { key: 'caste_certificate', label: 'ST Community / Tribe Certificate', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['certificate_no', 'issue_date', 'category', 'holder_name'], required: true },
        { key: 'income_certificate', label: 'Income Certificate (Family income <= 2.5 Lakhs)', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 12, ocrFields: ['annual_income', 'issue_date', 'issuing_authority'], required: true },
        { key: 'marksheet', label: 'Previous Class Passing Marksheet / School Report', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['percentage', 'roll_number', 'university', 'year_of_passing'], required: true },
        { key: 'aadhaar', label: 'Student / Parent Aadhaar Copy', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['aadhaarLast4'], required: true },
        { key: 'bank_passbook', label: 'Aadhaar-Seeded Bank Account Passbook Copy', acceptedTypes: ['pdf', 'jpg', 'png'], maxAgeMonths: 0, ocrFields: ['account_no', 'ifsc', 'holder_name'], required: true }
      ],
      eligibilityRules: [
        { field: 'category', operator: 'equals', value: 'ST', message: 'Student must belong to Scheduled Tribe (ST)' },
        { field: 'familyIncome', operator: 'lte', value: 250000, message: 'Annual family income must not exceed Rs 2,50,000' },
        { field: 'marksPercent', operator: 'gte', value: 40, message: 'Must have passed previous annual school exam' }
      ],
      meritWeights: { marksPercent: 1.0 },
      reservationQuota: { female: 0.30, disability: 0.05, pvtg: 0.05 }
    });

    const allSchemes = [nfstScheme, nosScheme, topClassScheme, postMatricScheme, preMatricScheme];

    // 4. Create ~40 Applications across all stages & Schemes
    const stages = [
      'DRAFT', 'SUBMITTED', 'OCR_PROCESSING', 'AUTO_VERIFIED', 'DEFICIENT',
      'UNDER_VERIFICATION', 'UNDER_SCRUTINY', 'ELIGIBLE', 'INELIGIBLE',
      'MERIT_LISTED', 'SELECTED', 'WAITLISTED', 'REJECTED', 'AWARD_ACCEPTED', 'DISBURSING', 'COMPLETED'
    ];

    console.log('[Seed]: Populating realistic applications, documents, and audit logs across all 5 schemes...');

    for (let i = 0; i < createdApplicants.length; i++) {
      const applicant = createdApplicants[i];
      const scheme = allSchemes[i % allSchemes.length];
      const appStage = stages[i % stages.length];

      const appNo = `${scheme.code}/2026/${String(i + 1).padStart(6, '0')}`;

      const formData = {
        category: applicant.profile.category,
        familyIncome: applicant.profile.familyIncome,
        marksPercent: applicant.profile.education.marksPercent,
        educationLevel: applicant.profile.education.level,
        course: applicant.profile.education.course,
        university: applicant.profile.education.university,
        studyCountry: scheme.code === 'NOS' ? 'United Kingdom' : undefined,
        foreignUniversity: scheme.code === 'NOS' ? 'University of Oxford' : undefined,
        admissionStatus: scheme.code === 'NOS' ? 'Unconditional Offer' : undefined,
        researchTopic: scheme.code === 'NFST' ? 'Genomic Profiling of Indigenous Flora' : undefined,
        researchGuide: scheme.code === 'NFST' ? 'Prof. S. K. Mahato' : undefined,
        entranceScore: 78 + (i % 15),
        interviewScore: 75 + (i % 20),
        bankAccount: applicant.profile.bankAccount,
        ifsc: applicant.profile.ifsc,
        aadhaarLast4: applicant.profile.aadhaarLast4
      };

      const stageHistory = [
        { stage: 'DRAFT', at: new Date(Date.now() - 20 * 86400000), by: applicant.name, remark: 'Draft created' }
      ];

      if (appStage !== 'DRAFT') {
        stageHistory.push({
          stage: 'SUBMITTED',
          at: new Date(Date.now() - 18 * 86400000),
          by: applicant.name,
          remark: 'Submitted online'
        });
        stageHistory.push({
          stage: appStage,
          at: new Date(Date.now() - 2 * 86400000),
          by: 'System / Officer',
          remark: `Stage transitioned to ${appStage}`
        });
      }

      const flags = [];
      // Intentional anomaly cases for demo
      if (i === 4) {
        flags.push('ANOMALY_DUPLICATE_CERT');
      }
      if (applicant.profile.familyIncome > 800000) {
        flags.push('INCOME_LIMIT_EXCEEDED');
      }

      const application = await Application.create({
        applicantId: applicant._id,
        schemeId: scheme._id,
        applicationNo: appNo,
        formData,
        status: appStage,
        stageHistory,
        flags,
        meritScore: 72 + (i % 25),
        meritRank: i + 1,
        isSelected: ['SELECTED', 'AWARD_ACCEPTED', 'DISBURSING', 'COMPLETED'].includes(appStage),
        isWaitlisted: appStage === 'WAITLISTED',
        submittedAt: appStage !== 'DRAFT' ? new Date(Date.now() - 18 * 86400000) : null
      });

      // Create documents for this application
      if (appStage !== 'DRAFT') {
        // Document 1: Caste Certificate
        const casteFile = path.join(samplesDir, 'caste_certificate_correct.txt');
        const casteHash = calculateFileHash(casteFile);
        const certDoc = await Document.create({
          applicationId: application._id,
          docKey: 'caste_certificate',
          originalName: 'caste_certificate_st.pdf',
          storedPath: casteFile,
          sha256: casteHash,
          mimeType: 'application/pdf',
          ocrStatus: 'done',
          confidence: 94,
          classificationConfidence: 91,
          matchedKeywords: ['scheduled tribe', 'caste certificate', 'sub-divisional magistrate'],
          detectedDocType: 'caste_certificate',
          ocrExtracted: {
            certificate_no: i === 4 ? 'ST/JH/2023/8892' : `ST/${applicant.profile.state.slice(0, 2).toUpperCase()}/2023/${1000 + i}`,
            category: 'Scheduled Tribe (ST)',
            holder_name: applicant.name,
            issue_date: '15/08/2023',
            issuing_authority: 'Sub-Divisional Magistrate'
          },
          mismatches: [],
          verificationStatus: ['DEFICIENT', 'UNDER_VERIFICATION'].includes(appStage) ? 'needs_review' : 'approved'
        });

        // Document 2: Income Certificate (inject deliberate mismatch on Rahul Kumar i=0)
        const isMismatchCase = i === 0;
        const incomeDoc = await Document.create({
          applicationId: application._id,
          docKey: 'income_certificate',
          originalName: 'income_cert_2025.pdf',
          storedPath: path.join(samplesDir, isMismatchCase ? 'income_certificate_mismatch.txt' : 'income_certificate_correct.txt'),
          sha256: calculateFileHash(path.join(samplesDir, 'income_certificate_correct.txt')),
          mimeType: 'application/pdf',
          ocrStatus: 'done',
          confidence: 92,
          classificationConfidence: 89,
          matchedKeywords: ['income certificate', 'annual income', 'tahsildar'],
          detectedDocType: 'income_certificate',
          ocrExtracted: {
            annual_income: isMismatchCase ? 450000 : applicant.profile.familyIncome,
            issue_date: '10/01/2025',
            issuing_authority: 'Tahsildar'
          },
          mismatches: isMismatchCase ? [{
            field: 'familyIncome',
            declared: '₹3,00,000',
            extracted: '₹4,50,000',
            severity: 'warning',
            message: 'You entered ₹3,00,000 but the certificate shows ₹4,50,000.'
          }] : [],
          verificationStatus: isMismatchCase ? 'needs_review' : 'approved'
        });

        // Document 3: Marksheet
        await Document.create({
          applicationId: application._id,
          docKey: 'marksheet',
          originalName: 'master_marksheet.pdf',
          storedPath: path.join(samplesDir, 'marksheet_correct.txt'),
          sha256: calculateFileHash(path.join(samplesDir, 'marksheet_correct.txt')),
          mimeType: 'application/pdf',
          ocrStatus: 'done',
          confidence: 90,
          classificationConfidence: 87,
          matchedKeywords: ['statement of marks', 'percentage', 'semester'],
          detectedDocType: 'marksheet',
          ocrExtracted: {
            percentage: applicant.profile.education.marksPercent,
            university: applicant.profile.education.university,
            roll_number: `RU/2024/ST/${100 + i}`,
            year_of_passing: 2024
          },
          verificationStatus: 'approved'
        });

        // If deficient, create an open Deficiency record
        if (appStage === 'DEFICIENT') {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 5);
          await Deficiency.create({
            applicationId: application._id,
            docKey: 'income_certificate',
            reason: 'Income certificate scan was unclear and exceeded validity period. Please re-upload.',
            raisedBy: 'AI_OCR_ENGINE',
            dueDate,
            status: 'open'
          });
        }

        // If in disbursement or selected, create Disbursement record
        if (['SELECTED', 'AWARD_ACCEPTED', 'DISBURSING', 'COMPLETED'].includes(appStage)) {
          await Disbursement.create({
            applicationId: application._id,
            installmentNo: 1,
            amount: 192000,
            dueDate: new Date(Date.now() - 10 * 86400000),
            status: appStage === 'DISBURSING' || appStage === 'COMPLETED' ? 'released' : 'pending',
            guideApproved: true,
            releasedAt: appStage === 'DISBURSING' || appStage === 'COMPLETED' ? new Date() : null,
            transactionId: `PFMS2026${88120 + i}`,
            remarks: 'First installment released via DBT PFMS'
          });
        }
      }
    }

    // 5. Create initial notifications
    await Notification.create({
      userId: createdApplicants[0]._id,
      channel: 'inapp',
      type: 'OCR_COMPLETED',
      subject: 'OCR Extraction Complete for Application #NOS/2026/000001',
      body: 'Your documents have been processed. Discrepancy noted in Income Certificate: Entered ₹3,00,000 vs Extracted ₹4,50,000.',
      link: `/applicant/applications`,
      sentAt: new Date(),
      read: false
    });

    // 6. Create initial Audit Logs
    await AuditLog.create({
      actorId: admin._id,
      actorName: admin.name,
      actorRole: 'admin',
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'System',
      entityId: 'ROOT',
      reason: 'Initialized MoTA Scholarship & Fellowship Management System database with rules and active schemes.',
      ip: '127.0.0.1'
    });

    console.log('\n================================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
    console.log('🏛️  PORTAL ACCOUNTS & CREDENTIALS:');
    console.log('----------------------------------------------------------------');
    console.log('👑 ADMIN (Ministry):     admin@mota.gov.in       | Password: Admin@123');
    console.log('🔍 VERIFIER 1:           verifier1@mota.gov.in   | Password: Verifier@123');
    console.log('🔍 VERIFIER 2:           verifier2@mota.gov.in   | Password: Verifier@123');
    console.log('⚖️  OFFICER 1:            officer1@mota.gov.in    | Password: Officer@123');
    console.log('⚖️  OFFICER 2:            officer2@mota.gov.in    | Password: Officer@123');
    console.log('🎓 APPLICANT (Demo):     rahul.st@example.com    | Password: Applicant@123');
    console.log('🎓 APPLICANTS (Others):  sunita.soren@example.com| Password: Applicant@123');
    console.log('================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Database Error]: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
