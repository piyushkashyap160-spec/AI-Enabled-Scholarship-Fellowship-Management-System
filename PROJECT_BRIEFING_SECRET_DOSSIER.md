# 📜 MINISTRY OF TRIBAL AFFAIRS (MoTA) — PROJECT MASTER DOSSIER & TEAM BRIEFING
### Smart India Hackathon (SIH 2026) | Problem Statement 26239
> **CONFIDENTIAL & MASTER REFERENCE FOR ALL TEAM MEMBERS AND JUDGES**

---

## 1. 📌 Project Title & Identification
- **Project Name:** AI-Enabled Scholarship & Fellowship Management System for Scheduled Tribes
- **Problem Statement ID:** SIH PS 26239
- **Organization / Ministry:** Ministry of Tribal Affairs (MoTA), Government of India
- **Theme:** Smart Education / Software Category
- **Target Flagship Schemes:**
  1. **NFST (National Fellowship for Scheduled Tribes):** M.Phil and Ph.D. research fellowships in Indian Universities (~750 seats, ₹32,000/mo JRF stipend + annual contingency).
  2. **NOS (National Overseas Scholarship):** Master's and Ph.D. scholarships abroad in the UK, USA, Australia, Germany, and Canada (~100 seats, covering complete international tuition fees, visa, travel, and living stipend).

---

## 2. ❓ Why is this Project Used? (The Problem It Solves)

### The Legacy Manual Process (Before This System):
1. **Months of Human Delay:** Officials in MoTA had to manually open and inspect thousands of scanned PDFs and JPEG certificates (caste certificates, income certificates, university marksheets, foreign admission offer letters).
2. **Back-and-Forth Email Chasing:** When an applicant submitted a blurry scan or missing page, officers sent manual emails, causing weeks of deficiency lag.
3. **Hardcoded Spreadsheet Nightmares:** Scheme rules and merit rankings were maintained in static spreadsheets. If the Ministry wanted to adjust the income cap from ₹8 Lakh to ₹6 Lakh, the entire spreadsheet had to be manually rewritten.
4. **Zero Real-Time Transparency:** Applicants had no idea which stage their application was in, and whether their income or caste certificate satisfied criteria.

### The AI-Enabled Solution (This System):
- **Automated Instant Pre-Check:** Visitors check criteria before applying with green ticks and red crosses.
- **Offline AI OCR Verification:** Local machine vision (`tesseract.js` + `pdf-parse`) reads uploaded certificates asynchronously in seconds, classifies them, extracts attributes, and flags mismatches automatically.
- **Pure Data-Driven Rules Engine:** Rules live in MongoDB as data. Ministry admins can edit income caps or mark criteria live on screen with a single click—no code changes required!
- **Human-in-the-Loop Governance:** AI extracts, verifies, flags, and suggests. Human officers execute all final eligibility approvals and merit overrides with a mandatory written audit trail.

---

## 3. 👤 Why is the User Profile Needed & Necessary?

The **User Profile** (`user.profile`) is the cornerstone of the entire automated verification architecture:

1. **Pre-Populating Eligibility Checks:** When an ST applicant opens a scheme application, their category, domicile state, qualifying marks, and annual income are automatically pre-filled from their verified profile, preventing repetitive manual typing.
2. **Cross-Referencing OCR Extracted Data (Discrepancy Catching):** When an applicant uploads an income certificate or caste certificate, the AI OCR extracts the name, income number, and certificate ID, and automatically checks them against `user.profile`. If the profile declares `₹3,00,000` but the certificate shows `₹4,50,000`, the system instantly flags the discrepancy for officer review!
3. **Direct Benefit Transfer (DBT) & PFMS Disbursement:** The profile holds the student's verified bank account and IFSC code, allowing the Ministry to track installment disbursements via the Public Financial Management System (PFMS).
4. **Persistent Multilingual Experience:** The profile remembers the student's preferred language (`'en'` or `'hi'`), ensuring all notification templates and alerts appear in their native language.

---

## 4. 🗂️ Folder Structure Explained: `backend` vs `server`, `frontend` vs `client`

### Are `backend` and `server` the same thing?
**YES, exactly the same!**
- In web development, **"Backend"** is the architectural concept (the server-side logic, database models, OCR processing, and API routes).
- **"Server"** is the physical directory name where the Node.js Express code is located.
- In this project, we created a symbolic link `backend -> server`. So whether you type `cd backend` or `cd server`, you are accessing the exact same files!

### Are `frontend` and `client` the same thing?
**YES, exactly the same!**
- **"Frontend"** is the user interface seen in the web browser (React, Bootstrap 5, interactive forms, Chart.js graphs, timelines).
- **"Client"** is the standard directory name used by modern bundlers like Vite.
- In this project, we created a symbolic link `frontend -> client`. So whether you type `cd frontend` or `cd client`, you access the exact same UI!

### Why are they split into two folders?
1. **Separation of Concerns:** The backend handles sensitive secrets, database operations, and CPU-intensive OCR tasks. The frontend handles rendering and user interaction.
2. **Independent Dependencies:** The backend needs `mongoose`, `jsonwebtoken`, `bcryptjs`, and `tesseract.js`. The frontend needs `react`, `react-bootstrap`, `react-router-dom`, and `chart.js`. Separate `package.json` files keep the code lightweight and modular.

---

## 5. 👥 The Four Roles & Permissions

| Role | Who Uses It | Key Responsibilities |
| :--- | :--- | :--- |
| 🎓 **Applicant (ST Scholar)** | ST Students applying for NFST / NOS | Pre-check eligibility, submit applications, upload certificates, track live stage timeline, resolve deficiencies, upload fellowship progress reports. |
| 🔍 **Document Verifier** | Ministry Data Verification Staff | Work the document verification queue, inspect OCR confidence, approve or reject certificates, raise formal deficiency notices. |
| ⚖️ **Scrutiny Officer** | Ministry Gazetted Officers | Review verified applications, make final `ELIGIBLE` / `INELIGIBLE` determinations with mandatory written justifications, recommend candidates for merit ranking. |
| 👑 **Ministry Admin** | Ministry Leadership & Directors | View executive dashboards, use the **Rule Builder Simulator** to test rules live against applicants, publish official merit lists with horizontal quotas, investigate fraud anomalies, review immutable audit logs. |

---

## 6. 🏆 The Top 3 Demo Moments for Judges

1. **The 30-Second Rule Builder Demonstration (Show Stopper ⭐):**
   - Log in as **Admin** (`admin@mota.gov.in`).
   - Open **Rule Builder** → Select `NFST`.
   - Change the Income cap from `₹8,00,000` to `₹4,00,000`.
   - Click **"Test this rule set against existing applications (Live Demo)"**.
   - Show the judges how the system instantly simulates all ~40 applications live in memory, displaying passing/failing applicant breakdowns before committing to the database!
2. **Uploading an Intentionally Wrong Document (OCR Intelligence):**
   - Log in as **Applicant** (`rahul.st@example.com`).
   - Upload `college_id_card_wrong.txt` into an income certificate slot.
   - The AI OCR detects keywords and classifies: *"Uploaded file appears to be a College ID, not an Income Certificate."*
3. **The Human-in-the-Loop & Audit Log Defense:**
   - When judges ask about AI ethics: *"The AI extracts, checks, flags and explains. Every rejection carries a stated reason, every override requires a written justification, and every action is in an audit log. A human officer makes every final decision."*

---

## 7. 🚀 Master Command Cheat Sheet

```bash
# 1. To Seed the Database (Creates test users, schemes & applications):
cd server && npm run seed

# 2. To Start the Backend API (Runs on port 5001):
cd server && npm run dev

# 3. To Start the Frontend React Client (Runs on port 5173):
cd client && npm run dev
```

### Pre-Seeded Credentials:
- **Admin:** `admin@mota.gov.in` / `Admin@123`
- **Verifier 1:** `verifier1@mota.gov.in` / `Verifier@123`
- **Officer 1:** `officer1@mota.gov.in` / `Officer@123`
- **Applicant:** `rahul.st@example.com` / `Applicant@123`

---
*Created for Smart India Hackathon 2026 | Ministry of Tribal Affairs (MoTA)*
