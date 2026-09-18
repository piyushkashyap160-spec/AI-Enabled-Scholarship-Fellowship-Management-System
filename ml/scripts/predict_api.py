"""
predict_api.py
Inference engine that executes ML predictions for scholarship applications:
1. Eligibility Decision & Confidence Score
2. Merit Ranking Score
3. Fraud Risk Score
4. Best Scheme Recommendations
"""

import sys
import json
import warnings
import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings('ignore')

# Load saved models
clf_eligibility = joblib.load('ml/models/eligibility_classifier.joblib')
reg_merit = joblib.load('ml/models/merit_regressor.joblib')
clf_fraud = joblib.load('ml/models/fraud_classifier.joblib')
iso_forest = joblib.load('ml/models/isolation_forest.joblib')
recommender = joblib.load('ml/models/scheme_recommender.joblib')
scaler = joblib.load('ml/models/scholarship_scaler.joblib')
encoders = joblib.load('ml/models/scholarship_encoders.joblib')

def predict_application(app_data):
    """
    Evaluates a single application using all ML models.
    """
    # 1. Prepare Feature Vector for Eligibility & Merit
    scheme_code = app_data.get('scheme_code', 'ARG45')
    age = int(app_data.get('age', 24))
    gender = app_data.get('gender', 'female').lower()
    state = app_data.get('state', 'Jharkhand')
    edu_level = app_data.get('education_level', 'masters').lower()
    marks = float(app_data.get('marks_percent', 75.0))
    income = float(app_data.get('family_income', 250000))
    nirf = int(app_data.get('nirf_rank', 50))
    qs_rank = int(app_data.get('qs_rank', 999))
    has_admission = 1 if app_data.get('has_admission_offer', True) else 0
    is_pwd = 1 if app_data.get('is_pwd', False) else 0
    pwd_percent = int(app_data.get('pwd_percent', 0))
    ocr_caste = 1 if app_data.get('ocr_caste_ok', True) else 0
    ocr_income = 1 if app_data.get('ocr_income_ok', True) else 0
    ocr_acad = 1 if app_data.get('ocr_academic_ok', True) else 0
    
    # Safe encoding
    scheme_enc = encoders['scheme_code'].transform([scheme_code])[0] if scheme_code in encoders['scheme_code'].classes_ else 0
    gender_enc = encoders['gender'].transform([gender])[0] if gender in encoders['gender'].classes_ else 0
    state_enc = encoders['state'].transform([state])[0] if state in encoders['state'].classes_ else 0
    edu_enc = encoders['education_level'].transform([edu_level])[0] if edu_level in encoders['education_level'].classes_ else 0
    
    feat_vector = np.array([[
        scheme_enc, age, gender_enc, state_enc, edu_enc,
        marks, income, nirf, qs_rank, has_admission,
        is_pwd, pwd_percent, ocr_caste, ocr_income, ocr_acad
    ]])
    
    # Predict Eligibility
    feat_scaled = scaler.transform(feat_vector)
    decision_idx = clf_eligibility.predict(feat_scaled)[0]
    decision_label = encoders['decision'].inverse_transform([decision_idx])[0]
    decision_probs = clf_eligibility.predict_proba(feat_scaled)[0]
    confidence = float(np.max(decision_probs))
    
    # Predict Merit Score
    merit_score = float(reg_merit.predict(feat_vector)[0])
    merit_score = round(max(0.0, min(100.0, merit_score)), 2)
    
    # 2. Predict Fraud & Discrepancies
    ocr_sim = float(app_data.get('ocr_text_similarity', 0.95))
    inc_ratio = float(app_data.get('income_discrepancy_ratio', 1.0))
    marks_disc = float(app_data.get('marks_discrepancy', 0.0))
    dup_cert = int(app_data.get('duplicate_cert_count', 1))
    dup_bank = int(app_data.get('duplicate_bank_count', 1))
    name_score = float(app_data.get('fuzzy_name_match_score', 0.98))
    tamper_flag = int(app_data.get('certificate_tamper_flag', 0))
    
    fraud_vector = np.array([[
        ocr_sim, inc_ratio, marks_disc, dup_cert,
        dup_bank, name_score, tamper_flag
    ]])
    
    fraud_risk_prob = float(clf_fraud.predict_proba(fraud_vector)[0][1])
    is_anomaly = bool(iso_forest.predict(fraud_vector)[0] == -1)
    
    fraud_status = 'High Risk' if (fraud_risk_prob > 0.65 or (is_anomaly and fraud_risk_prob > 0.4)) else ('Suspicious' if fraud_risk_prob > 0.3 else 'Clean / Normal')
    
    # 3. Predict Scheme Recommendation
    rec_vector = np.array([[age, gender_enc, state_enc, edu_enc, marks, income, is_pwd]])
    rec_scheme_idx = recommender.predict(rec_vector)[0]
    recommended_scheme = encoders['scheme_code'].inverse_transform([rec_scheme_idx])[0]
    
    if decision_label == 'Eligible':
        status_tag = 'Auto-Approve Candidate' if confidence >= 0.80 else 'Eligible (Review Recommended)'
    elif decision_label == 'Borderline':
        status_tag = 'Requires Officer Scrutiny'
    else:
        status_tag = 'Flagged Ineligible'

    return {
        'eligibility': {
            'decision': decision_label,
            'confidence': round(confidence * 100, 1),
            'status_tag': status_tag
        },
        'merit_assessment': {
            'predicted_merit_score': merit_score,
            'estimated_national_percentile': round(min(99.9, merit_score * 0.98 + 1.5), 1),
            'seat_allocation_prospect': 'High' if merit_score >= 70.0 else ('Moderate' if merit_score >= 50.0 else 'Low')
        },
        'fraud_risk_assessment': {
            'fraud_risk_score': round(fraud_risk_prob * 100, 1),
            'risk_level': fraud_status,
            'is_statistical_anomaly': is_anomaly,
            'confidence_passed': fraud_risk_prob < 0.30
        },
        'recommendation': {
            'top_scheme_match': recommended_scheme,
            'reason': f"Profile aligned with {recommended_scheme} criteria (Marks: {marks}%, Income: ₹{int(income):,}, Level: {edu_level})"
        }
    }

if __name__ == '__main__':
    if len(sys.argv) > 1:
        raw_input = sys.argv[1]
        try:
            sample_data = json.loads(raw_input)
        except Exception:
            sample_data = {}
    else:
        # Sample Test Payload for ST Student applying for NFST
        sample_data = {
            'scheme_code': 'ARG45',
            'age': 25,
            'gender': 'female',
            'state': 'Jharkhand',
            'education_level': 'masters',
            'marks_percent': 78.5,
            'family_income': 220000,
            'nirf_rank': 45,
            'qs_rank': 999,
            'has_admission_offer': True,
            'is_pwd': False,
            'ocr_caste_ok': True,
            'ocr_income_ok': True,
            'ocr_academic_ok': True,
            'ocr_text_similarity': 0.96,
            'income_discrepancy_ratio': 1.0,
            'marks_discrepancy': 0.0,
            'duplicate_cert_count': 1,
            'duplicate_bank_count': 1,
            'fuzzy_name_match_score': 0.99
        }
        
    result = predict_application(sample_data)
    print(json.dumps(result, indent=2))
