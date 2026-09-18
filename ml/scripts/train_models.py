"""
train_models.py
Trains the complete Suite of Machine Learning Models for MoTA AI Scholarship System:
1. Eligibility Decision Classifier (Eligible, Borderline, Ineligible)
2. Merit Score & Percentile Rank Regressor
3. Fraud, Discrepancy & Anomaly Detector
4. Scheme Match Recommender Model
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, GradientBoostingRegressor, IsolationForest
from sklearn.metrics import classification_report, accuracy_score, r2_score, mean_squared_error, roc_auc_score

def train_scholarship_models():
    print("\n=======================================================")
    print(" 1. TRAINING SCHOLARSHIP ELIGIBILITY & MERIT MODELS")
    print("=======================================================")
    
    df = pd.read_csv('ml/data/mota_schemes_dataset.csv')
    print(f" Loaded {len(df)} samples from ml/data/mota_schemes_dataset.csv")
    
    # Feature Preprocessing
    categorical_cols = ['scheme_code', 'gender', 'state', 'education_level']
    encoders = {}
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
        
    feature_cols = [
        'scheme_code', 'age', 'gender', 'state', 'education_level',
        'marks_percent', 'family_income', 'nirf_rank', 'qs_rank',
        'has_admission_offer', 'is_pwd', 'pwd_percent',
        'ocr_caste_ok', 'ocr_income_ok', 'ocr_academic_ok'
    ]
    
    X = df[feature_cols]
    y_decision = df['decision']
    y_merit = df['merit_score']
    
    # Encode Target Labels for Decision
    decision_encoder = LabelEncoder()
    y_decision_encoded = decision_encoder.fit_transform(y_decision)
    encoders['decision'] = decision_encoder
    
    # Train / Test Split
    X_train, X_test, y_train_dec, y_test_dec, y_train_merit, y_test_merit = train_test_split(
        X, y_decision_encoded, y_merit, test_size=0.2, random_state=42, stratify=y_decision_encoded
    )
    
    # Scale Features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # --- MODEL 1: Eligibility Decision Classifier ---
    print("\n[+] Training Model 1: Eligibility Decision Classifier (Random Forest)...")
    clf = RandomForestClassifier(n_estimators=120, max_depth=12, random_state=42, n_jobs=-1)
    clf.fit(X_train_scaled, y_train_dec)
    
    y_pred_dec = clf.predict(X_test_scaled)
    acc = accuracy_score(y_test_dec, y_pred_dec)
    print(f" Eligibility Classifier Test Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test_dec, y_pred_dec, target_names=decision_encoder.classes_))
    
    # --- MODEL 2: Merit Score Regressor ---
    print("\n[+] Training Model 2: Merit Score Predictor (Gradient Boosting Regressor)...")
    reg = GradientBoostingRegressor(n_estimators=150, max_depth=6, learning_rate=0.08, random_state=42)
    reg.fit(X_train, y_train_merit)
    
    y_pred_merit = reg.predict(X_test)
    r2 = r2_score(y_test_merit, y_pred_merit)
    rmse = np.sqrt(mean_squared_error(y_test_merit, y_pred_merit))
    print(f" Merit Regressor R² Score: {r2:.4f} | RMSE: {rmse:.3f} points")
    
    # Feature Importances for Explainability
    importances = dict(zip(feature_cols, clf.feature_importances_))
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))
    print("\nTop Factors Driving Scholarship Decisions:")
    for feat, imp in list(sorted_importances.items())[:6]:
        print(f"  - {feat}: {imp * 100:.2f}% weight")
        
    # --- MODEL 4: Scheme Recommendation Multi-class Classifier ---
    print("\n[+] Training Model 4: Scheme Recommender...")
    rec_features = ['age', 'gender', 'state', 'education_level', 'marks_percent', 'family_income', 'is_pwd']
    X_rec = df[rec_features]
    y_rec = df['scheme_code'] # Already label encoded
    
    X_rec_train, X_rec_test, y_rec_train, y_rec_test = train_test_split(X_rec, y_rec, test_size=0.2, random_state=42)
    recommender = RandomForestClassifier(n_estimators=80, max_depth=8, random_state=42)
    recommender.fit(X_rec_train, y_rec_train)
    rec_acc = accuracy_score(y_rec_test, recommender.predict(X_rec_test))
    print(f" Scheme Recommender Test Accuracy: {rec_acc * 100:.2f}%")
    
    # Save Models
    os.makedirs('ml/models', exist_ok=True)
    joblib.dump(clf, 'ml/models/eligibility_classifier.joblib')
    joblib.dump(reg, 'ml/models/merit_regressor.joblib')
    joblib.dump(recommender, 'ml/models/scheme_recommender.joblib')
    joblib.dump(scaler, 'ml/models/scholarship_scaler.joblib')
    joblib.dump(encoders, 'ml/models/scholarship_encoders.joblib')
    
    with open('ml/models/feature_importance.json', 'w') as f:
        json.dump(sorted_importances, f, indent=2)
        
    print(" Saved Eligibility, Merit, Recommender, Scaler & Encoders to ml/models/")

def train_fraud_models():
    print("\n=======================================================")
    print(" 2. TRAINING FRAUD & ANOMALY DETECTION MODEL")
    print("=======================================================")
    
    df_fraud = pd.read_csv('ml/data/mota_fraud_detection_dataset.csv')
    print(f" Loaded {len(df_fraud)} samples from ml/data/mota_fraud_detection_dataset.csv")
    
    fraud_features = [
        'ocr_text_similarity',
        'income_discrepancy_ratio',
        'marks_discrepancy',
        'duplicate_cert_count',
        'duplicate_bank_count',
        'fuzzy_name_match_score',
        'certificate_tamper_flag'
    ]
    
    X_fraud = df_fraud[fraud_features]
    y_fraud = df_fraud['is_fraud']
    
    X_f_train, X_f_test, y_f_train, y_f_test = train_test_split(
        X_fraud, y_fraud, test_size=0.2, random_state=42, stratify=y_fraud
    )
    
    # Train Supervised Fraud Classifier
    fraud_clf = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    fraud_clf.fit(X_f_train, y_f_train)
    
    y_f_pred = fraud_clf.predict(X_f_test)
    y_f_proba = fraud_clf.predict_proba(X_f_test)[:, 1]
    
    f_acc = accuracy_score(y_f_test, y_f_pred)
    f_auc = roc_auc_score(y_f_test, y_f_proba)
    
    print(f" Fraud Classifier Test Accuracy: {f_acc * 100:.2f}% | ROC-AUC: {f_auc:.4f}")
    print("\nFraud Detection Report:")
    print(classification_report(y_f_test, y_f_pred, target_names=['Normal Application', 'Fraud / Tampered']))
    
    # Train Unsupervised Isolation Forest (for novel zero-day fraud patterns)
    print("\n[+] Training Unsupervised Isolation Forest Anomaly Detector...")
    iso_forest = IsolationForest(n_estimators=100, contamination=0.15, random_state=42)
    iso_forest.fit(X_fraud)
    
    joblib.dump(fraud_clf, 'ml/models/fraud_classifier.joblib')
    joblib.dump(iso_forest, 'ml/models/isolation_forest.joblib')
    print(" Saved Fraud Classifier & Isolation Forest to ml/models/")

if __name__ == '__main__':
    train_scholarship_models()
    train_fraud_models()
    print("\n ALL ML MODELS TRAINED & PACKAGED SUCCESSFULLY!")
