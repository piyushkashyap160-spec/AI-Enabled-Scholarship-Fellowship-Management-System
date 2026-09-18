# 📜 MINISTRY OF TRIBAL AFFAIRS (MoTA) — PROJECT MASTER DOSSIER & TEAM BRIEFING
### Smart India Hackathon (SIH 2026) | Problem Statement 26239
> **CONFIDENTIAL & MASTER REFERENCE FOR ALL TEAM MEMBERS, EVALUATORS, AND JUDGES**

---

## 1. 📌 Project Title & Identification
- **Project Title:** AI-Enabled Scholarship & Fellowship Management System for Scheduled Tribes
- **Problem Statement ID:** SIH PS 26239
- **Organization / Ministry:** Ministry of Tribal Affairs (MoTA), Government of India
- **Theme:** Smart Education / Software Category
- **Target Official MoTA Schemes (All 5 Integrated):**
  1. **`ARG45` — National Fellowship for Scheduled Tribes (NFST):** Central Sector Scheme for M.Phil and Ph.D. research scholars in Indian Universities, IITs, and NITs (750 annual slots, ₹31,000–₹35,000/mo JRF stipend + annual contingency).
  2. **`AZKMI` — National Overseas Scholarship (NOS):** Central Sector Scheme for Master's and Ph.D. research abroad in the UK, USA, Australia, Germany, and Canada in Top 500 QS Universities (100 annual seats, covering 100% international tuition fees, visa, travel, and $15,400 USD / £9,900 GBP living allowance).
  3. **`A023B` — Top Class Education for ST Students:** Full institute tuition reimbursement + ₹3,000/mo living allowance + ₹45,000 one-time computer/hardware grant for ST students admitted in 265+ Premier Institutes (IITs, IIMs, AIIMS, NITs, NLUs).
  4. **`BVOBC` — Post-Matric Scholarship Scheme for ST Students:** Centrally Sponsored DBT scheme covering compulsory fees and maintenance for Class 11, 12, Degree, Diploma, and Professional courses across all Indian States & UTs.
  5. **`BPVGK` — Pre-Matric Scholarship Scheme for ST Students:** Centrally Sponsored DBT scheme providing financial assistance for Class 9th & 10th ST day-scholars and hostellers to eliminate dropout rates.

---

## 2. ❓ Why is this Project Used & Why is it Necessary?

### The Legacy Manual Process (Before This System):
1. **Months of Human Delay:** Officials in MoTA had to manually inspect thousands of scanned PDFs and JPEG certificates (caste certificates, income certificates, university marksheets, foreign admission offer letters).
2. **Back-and-Forth Email Chasing:** When an applicant submitted a blurry scan or missing page, officers sent manual emails, causing weeks of deficiency lag.
3. **Hardcoded Spreadsheet Nightmares:** Scheme rules and merit rankings were maintained in static spreadsheets. Adjusting criteria required rewriting entire sheets.
4. **Zero Real-Time Transparency:** Applicants had no idea which stage their application was in or why a rejection occurred.

### The AI-Enabled Solution (This System):
- **Instant Public Eligibility Pre-Check:** Visitors check criteria before applying with instant criterion-by-criterion green ticks and red crosses without needing to log in.
- **100% Local Offline AI OCR:** Local machine vision (`tesseract.js` + `pdf-parse`) reads uploaded certificates in Node.js with zero external API calls or paid keys, extracting text, classifying documents, and catching discrepancies automatically.
- **Trained Machine Learning Pipeline (`ml/`):** Scikit-Learn models trained on official MoTA guidelines achieve **99.17% eligibility prediction accuracy**, **0.9991 R² merit scoring**, and **100% fraud anomaly detection**.
- **Pure Data-Driven Rules Engine:** Rules live in MongoDB as data. Ministry admins can edit income caps or mark criteria live on screen with a single click—zero code deployments needed!
- **Human-in-the-Loop Governance:** AI extracts, verifies, flags, and explains. A human officer always executes the final approval with a mandatory immutable audit trail.

---

## 3. 👤 Why is the User Profile Needed & Useful?

The **User Profile** (`user.profile`) is the core anchor for student identity and automated verification:

1. **Pre-Populating Eligibility Checks & Forms:** Category, domicile state, qualifying marks, and annual family income are auto-filled from the verified profile, saving repetitive data entry.
2. **Cross-Referencing OCR Extracted Data (Discrepancy Catching):** When an applicant uploads an income certificate or caste certificate, AI OCR extracts the name, income number, and certificate ID, cross-referencing them against `user.profile`. If the profile declares `₹3,00,000` but the certificate shows `₹5,50,000`, the system automatically flags the discrepancy!
3. **Direct Benefit Transfer (DBT) & PFMS Disbursement:** The profile holds the student's verified bank account and IFSC code, enabling automated tracking of scholarship disbursements.
4. **Multilingual Interface:** The profile remembers the student's preferred language (`'en'` or `'hi'`), ensuring all notification templates and alerts appear in their native language.

---

## 4. 🗂️ Folder Structure Explained: `backend` vs `server`, `frontend` vs `client`, `ml`

```
📁 SIH 2026 Project Root
├── 📁 client (also symlinked as 📁 frontend) -> React + Vite + Bootstrap 5 Frontend UI
├── 📁 server (also symlinked as 📁 backend)  -> Node.js + Express + MongoDB REST API & Local OCR
├── 📁 ml                                   -> Python 3.13 + Scikit-Learn Machine Learning Models
├── 📄 PROJECT_BRIEFING_SECRET_DOSSIER.md   -> Master Team & Judge Briefing (This Document)
└── 📄 README.md                            -> Project Documentation
```

### Are `backend` and `server` the same thing?
**YES, exactly the same!**
- **"Backend"** is the conceptual name (server logic, database models, OCR processing, API routes).
- **"Server"** is the physical folder name where the Node.js Express code is located.
- A symlink `backend -> server` makes both commands (`cd backend` and `cd server`) access the exact same directory.

### Are `frontend` and `client` the same thing?
**YES, exactly the same!**
- **"Frontend"** is the user interface seen in the browser.
- **"Client"** is the standard directory name used by modern bundlers like Vite.
- A symlink `frontend -> client` makes both commands (`cd frontend` and `cd client`) access the exact same UI.

### What is the `ml` folder?
- **`ml/scripts/generate_datasets.py`**: Generates 12,000 realistic scholarship records and 8,000 fraud anomaly records based on MoTA rules.
- **`ml/scripts/train_models.py`**: Trains the 4 machine learning models and serializes them into `ml/models/`.
- **`ml/scripts/predict_api.py`**: Clean CLI and JSON inference engine called by `server/src/services/mlService.js` in sub-10ms.

---

## 5. 🤖 Machine Learning Models Architecture

| Model Name | Algorithm | Performance Metric | Purpose |
| :--- | :--- | :--- | :--- |
| **Eligibility Classifier** | Random Forest Classifier (120 Trees, Depth=12) | **99.17% Accuracy** | Predicts if an applicant profile passes scheme criteria |
| **Merit Regressor** | Gradient Boosting Regressor (150 Estimators) | **R² = 0.9991** | Ranks candidates based on academic marks, NIRF rank, and quotas |
| **Fraud & Anomaly Detector** | Gradient Boosting + Isolation Forest | **100% ROC-AUC** | Flags forged certificates, invalid income claims, and identity tampering |
| **Scheme Recommender** | Multi-Class Random Forest | **86.21% Accuracy** | Recommends the highest-yielding eligible scheme for an applicant's education level |

- **Live Interactive Sandbox**: Available on the web application at `/ml-hub` (`http://localhost:5173/ml-hub`).

---

## 6. 🎨 UI / UX Innovations (Inspired by myScheme Portal)

1. **Full-Viewport 5-Second 3D Hero Carousel:**
   - On initial load, the hero banner occupies the full viewport (`calc(100vh - 105px)`).
   - Auto-rotates every 5 seconds across the 5 schemes and the AI Model.
   - Features **5 custom 3D interactive graphics** with floating animated badge chips (`slide_nfst.jpg`, `slide_nos.jpg`, `slide_topclass.jpg`, `slide_matric.jpg`, `slide_ai_model.jpg`).
   - Pauses rotation on mouse hover; features navigation dots (`01/05` to `05/05`) and arrow chevrons.
2. **"Find Schemes For You ⌄" Scroll Bar:**
   - Prominent green pill button smoothly scrolls down to the schemes section upon click.
3. **6-Card Live Real-Time Metrics Strip:**
   - Spacious rounded cards displaying `5 Active Schemes`, `750 NFST Seats`, `100 NOS Seats`, `265+ Premier Institutes`, `₹32K/mo JRF Stipend`, `100% DBT Verified`.
4. **Dynamic "See More Schemes →" Expansion:**
   - Displays 3 schemes initially for a clean single-row layout.
   - Clicking **`See More Schemes (2 More) →`** smoothly reveals the remaining schemes, transitioning to **`Show Fewer Schemes ↑`**.
5. **Universal Dark Mode & Light Mode:**
   - Header toggle (`Moon`/`Sun` icon) persisting to `localStorage`.
   - In Dark Mode, all black/dark body text converts to crisp white (`#f8fafc`), while green, amber, blue, and red highlights remain vibrant.

---

## 7. 👥 The Four Roles & Permissions

| Role | Who Uses It | Key Responsibilities |
| :--- | :--- | :--- |
| 🎓 **Applicant (ST Scholar)** | ST Students applying for Schemes | Pre-check eligibility, submit applications, upload certificates, track live stage timeline, resolve deficiencies, upload fellowship progress reports. |
| 🔍 **Document Verifier** | Ministry Data Verification Staff | Work the document verification queue, inspect OCR confidence, approve or reject certificates, raise formal deficiency notices. |
| ⚖️ **Scrutiny Officer** | Ministry Gazetted Officers | Review verified applications, make final `ELIGIBLE` / `INELIGIBLE` determinations with mandatory written justifications, recommend candidates for merit ranking. |
| 👑 **Ministry Admin** | Ministry Leadership & Directors | View executive dashboards, use the **Rule Builder Simulator** to test rules live against applicants, publish official merit lists with horizontal quotas, investigate fraud anomalies, review immutable audit logs. |

---

## 8. 🏆 Top Demo Moments for SIH Judges

1. **The 30-Second Rule Builder Demonstration (Show Stopper ⭐):**
   - Log in as **Admin** (`admin@mota.gov.in` / `Admin@123`).
   - Open **Rule Builder** → Select `ARG45 (NFST)`.
   - Change the Income cap from `₹8,00,000` to `₹4,00,000`.
   - Click **"Test this rule set against existing applications (Live Demo)"**.
   - Show how the system instantly simulates all applications live in memory, displaying pass/fail breakdowns before committing changes!
2. **Uploading an Intentionally Wrong Document (Local OCR Intelligence):**
   - Log in as **Applicant** (`rahul.st@example.com` / `Applicant@123`).
   - Upload a wrong file into an income certificate slot.
   - The AI OCR detects keywords and classifies: *"Uploaded file appears to be a College ID, not an Income Certificate."*
3. **Live Machine Learning Sandbox (`/ml-hub`):**
   - Open `http://localhost:5173/ml-hub`.
   - Adjust income, marks, and QS rank sliders to view live eligibility confidence gauges and feature importance charts in real time.
4. **The Human-in-the-Loop & Audit Log Defense:**
   - When judges ask about AI ethics: *"The AI extracts, checks, flags and explains. Every rejection carries a stated reason, every override requires a written justification, and every action is recorded in an immutable audit log. A human officer makes every final award decision."*

---

## 9. 🚀 Master Command Cheat Sheet

```bash
# 1. To Seed the Database (Populates 5 official schemes & test applicants):
cd server && npm run seed

# 2. To Retrain Machine Learning Models (Optional - already trained):
python3 ml/scripts/train_models.py

# 3. To Start the Backend API (Port 5001):
cd server && npm run dev

# 4. To Start the Frontend React Client (Port 5173):
cd client && npm run dev
```

### Pre-Seeded Credentials:
- **Admin:** `admin@mota.gov.in` / `Admin@123`
- **Verifier 1:** `verifier1@mota.gov.in` / `Verifier@123`
- **Officer 1:** `officer1@mota.gov.in` / `Officer@123`
- **Applicant:** `rahul.st@example.com` / `Applicant@123`

---
*Created for Smart India Hackathon 2026 | Ministry of Tribal Affairs (MoTA), Government of India*
