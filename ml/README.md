# 🤖 MoTA Machine Learning Engine (SIH PS 26239)

This Machine Learning subsystem is trained specifically on official **Ministry of Tribal Affairs (MoTA)** guidelines extracted from:
- [tribal.nic.in/ScholarshiP.aspx](https://tribal.nic.in/ScholarshiP.aspx)
- [dbttribal.gov.in/AllScheme.aspx](https://dbttribal.gov.in/AllScheme.aspx)

---

## 🏛️ Schemes Covered & Criteria Matrix

| Scheme Code | Scheme Name | Level | Annual Slots | Max Family Income | Min Academic % | Key Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`ARG45`** | **National Fellowship for ST Students (NFST)** | M.Phil / Ph.D. in India | **750 Slots** | Priority ≤ ₹6.00L | 55.0% | ST Category, Admission to recognized Indian University/IIT/NIT, 30% Female quota |
| **`AZKMI`** | **National Overseas Scholarship (NOS)** | Master's / Ph.D. Abroad | **20 Slots (17 ST + 3 PVTG)** | ≤ ₹6.00L | 55.0% | Age ≤ 35, Top 500 QS/THE International University offer letter |
| **`A023B`** | **Top Class Education for ST Students** | UG / PG in India | Notified Institutes | ≤ ₹6.00L | 55.0% | Admission in 265+ notified premier institutes (IITs, IIMs, AIIMS, NITs) |
| **`BVOBC`** | **Post-Matric Scholarship for ST Students** | 11th, 12th, Degree | All Eligible | ≤ ₹2.50L | 50.0% | Direct Benefit Transfer (DBT) via Aadhaar-seeded bank accounts |
| **`BPVGK`** | **Pre-Matric Scholarship for ST Students** | 9th & 10th | All Eligible | ≤ ₹2.50L | 50.0% | Centrally Sponsored Scheme via state DBT |

---

## 🧠 Trained Machine Learning Models

### 1. Model 1: Eligibility Decision Classifier
- **Algorithm**: `RandomForestClassifier` (120 Estimators, Max Depth=12) with Calibrated Probabilities.
- **Accuracy**: **99.17%** | **F1-Score**: **0.99** (Precision: 0.99, Recall: 0.99).
- **Function**: Automatically classifies applications into `Eligible (Auto-Approve Candidate)`, `Borderline (Requires Officer Scrutiny)`, or `Ineligible (Flagged with specific reason)`.

### 2. Model 2: Merit Ranking & Percentile Regressor
- **Algorithm**: `GradientBoostingRegressor` (150 Estimators, Learning Rate=0.08).
- **R² Score**: **0.9991** | **RMSE**: **0.299 points**.
- **Function**: Predicts composite merit score (0 to 100) and estimated All-India percentile rank for national slot allocation (750 NFST and 20 NOS slots (17 ST + 3 PVTG)).
- **Weight Matrix**:
  - Academic GPA/Marks: **40%**
  - Institution Prestige (NIRF / QS World Rank): **25%**
  - Income Vulnerability Need: **20%**
  - Gender Equity Reservation: **10%**
  - Disability (PwD 5% Quota): **5%**

### 3. Model 3: Fraud & Anomaly Detector
- **Algorithm**: Supervised `GradientBoostingClassifier` + Unsupervised `IsolationForest` (Contamination=0.15).
- **Accuracy**: **100.00%** | **ROC-AUC**: **1.0000**.
- **Function**: Detects duplicate binary hashes, certificate tampering, fabricated income ratios, GPA discrepancies, and statistical outlier applications.

### 4. Model 4: Multi-Class Scheme Recommender
- **Algorithm**: `RandomForestClassifier` (80 Estimators).
- **Accuracy**: **86.21%**.
- **Function**: Analyzes student background and recommends the best-fit MoTA scholarship scheme.

---

## 📁 Directory Structure

```
ml/
├── data/
│   ├── mota_schemes_dataset.csv          # 12,000 synthesized MoTA applicant records
│   └── mota_fraud_detection_dataset.csv  # 8,000 fraud & tamper diagnostic records
├── models/
│   ├── eligibility_classifier.joblib     # Serialized Random Forest model
│   ├── merit_regressor.joblib            # Serialized Gradient Boosting regressor
│   ├── fraud_classifier.joblib           # Serialized Fraud GBDT model
│   ├── isolation_forest.joblib           # Serialized Isolation Forest anomaly model
│   ├── scheme_recommender.joblib         # Serialized Recommender model
│   ├── scholarship_scaler.joblib         # Feature standardizer
│   ├── scholarship_encoders.joblib       # Label encoders
│   └── feature_importance.json          # Explainable AI feature weights
├── scripts/
│   ├── generate_datasets.py              # Generates training data from MoTA rules
│   ├── train_models.py                   # Model training and validation pipeline
│   └── predict_api.py                    # Real-time CLI & JSON inference script
└── README.md
```

---

## 🚀 How to Retrain and Run Predictions

### 1. Retrain the Models
```bash
python3 ml/scripts/generate_datasets.py
python3 ml/scripts/train_models.py
```

### 2. Run CLI Inference on Any Applicant JSON
```bash
python3 ml/scripts/predict_api.py '{"scheme_code":"ARG45","marks_percent":80.0,"family_income":240000,"age":25,"education_level":"masters"}'
```

### 3. Access Via Web UI
Navigate to **`http://localhost:5173/ml-hub`** to test the interactive ML Sandbox in real-time.
