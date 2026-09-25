"""
generate_datasets.py
Generates realistic training datasets based on official Ministry of Tribal Affairs (MoTA) guidelines:
- tribal.nic.in/ScholarshiP.aspx
- dbttribal.gov.in/AllScheme.aspx

Schemes:
1. ARG45 - National Fellowship for Higher Education of ST Students (NFST) (750 slots)
2. AZKMI - National Overseas Scholarship (NOS) (20 slots (17 ST + 3 PVTG))
3. A023B - Top Class Education for ST Students (265+ Institutes)
4. BVOBC - Post-Matric Scholarship Scheme for ST Students
5. BPVGK - Pre-Matric Scholarship Scheme for ST Students
"""

import os
import random
import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

STATES = [
    'Jharkhand', 'Odisha', 'Madhya Pradesh', 'Chhattisgarh', 'Assam',
    'Maharashtra', 'Rajasthan', 'Gujarat', 'Meghalaya', 'Nagaland',
    'Manipur', 'Mizoram', 'Tripura', 'Arunachal Pradesh', 'Sikkim',
    'Andhra Pradesh', 'Telangana', 'Karnataka', 'Kerala', 'Tamil Nadu'
]

INDIAN_UNIVERSITIES = [
    ('Ranchi University', 85),
    ('Central University of Jharkhand', 65),
    ('IIT Bombay', 3),
    ('IIT Delhi', 2),
    ('IIT Kharagpur', 6),
    ('IIM Ahmedabad', 1),
    ('AIIMS New Delhi', 1),
    ('Jawaharlal Nehru University', 2),
    ('Banaras Hindu University', 5),
    ('North-Eastern Hill University', 72),
    ('Gauhati University', 88),
    ('Utkal University', 95),
    ('Rajiv Gandhi University Arunachal', 110),
    ('Tezpur University', 59),
    ('Mizoram University', 78),
    ('State University of MP', 140),
    ('Local College', 250)
]

FOREIGN_UNIVERSITIES = [
    ('University of Oxford', 3),
    ('University of Cambridge', 2),
    ('Harvard University', 4),
    ('MIT', 1),
    ('Imperial College London', 6),
    ('National University of Singapore', 8),
    ('University of Melbourne', 14),
    ('University of Toronto', 21),
    ('University of Edinburgh', 22),
    ('Technical University of Munich', 37),
    ('University of Manchester', 32),
    ('Non-ranked Foreign College', 650)
]

def generate_scholarship_dataset(num_samples=12000):
    rows = []
    
    for _ in range(num_samples):
        # Pick scheme
        scheme_code = random.choices(
            ['ARG45', 'AZKMI', 'A023B', 'BVOBC', 'BPVGK'],
            weights=[0.25, 0.15, 0.20, 0.25, 0.15]
        )[0]
        
        gender = random.choices(['female', 'male', 'other'], weights=[0.48, 0.50, 0.02])[0]
        state = random.choice(STATES)
        is_pwd = 1 if random.random() < 0.05 else 0
        pwd_percent = random.randint(40, 80) if is_pwd else 0
        
        if scheme_code == 'BPVGK': # Pre-Matric (9th-10th)
            age = random.randint(14, 17)
            edu_level = '10th'
            marks = round(random.uniform(45.0, 95.0), 1)
            income = round(random.uniform(30000, 350000), -3)
            institute, nirf = ('Government High School', 999)
            qs_rank = 999
            has_admission_offer = 1
            study_country = 'India'
            
            # Rule: Income <= 250000, Category ST
            eligible = 1 if income <= 250000 and marks >= 50.0 else 0
            
        elif scheme_code == 'BVOBC': # Post-Matric (11th, 12th, UG)
            age = random.randint(17, 24)
            edu_level = random.choice(['12th', 'bachelors'])
            marks = round(random.uniform(45.0, 96.0), 1)
            income = round(random.uniform(40000, 400000), -3)
            inst_tuple = random.choice(INDIAN_UNIVERSITIES)
            institute, nirf = inst_tuple[0], inst_tuple[1]
            qs_rank = 999
            has_admission_offer = 1
            study_country = 'India'
            
            eligible = 1 if income <= 250000 and marks >= 50.0 else 0
            
        elif scheme_code == 'A023B': # Top Class (IITs/IIMs/AIIMS)
            age = random.randint(18, 25)
            edu_level = random.choice(['bachelors', 'masters'])
            marks = round(random.uniform(55.0, 98.0), 1)
            income = round(random.uniform(80000, 800000), -3)
            # Pick from premier
            inst_tuple = random.choice(INDIAN_UNIVERSITIES[:9] if random.random() < 0.8 else INDIAN_UNIVERSITIES[9:])
            institute, nirf = inst_tuple[0], inst_tuple[1]
            qs_rank = 999
            has_admission_offer = 1 if random.random() < 0.95 else 0
            study_country = 'India'
            
            eligible = 1 if (income <= 600000 and marks >= 55.0 and nirf <= 100 and has_admission_offer) else 0
            
        elif scheme_code == 'ARG45': # NFST (M.Phil / Ph.D. in India)
            age = random.randint(22, 36)
            edu_level = random.choice(['masters', 'phd'])
            marks = round(random.uniform(50.0, 95.0), 1)
            income = round(random.uniform(60000, 900000), -3)
            inst_tuple = random.choice(INDIAN_UNIVERSITIES)
            institute, nirf = inst_tuple[0], inst_tuple[1]
            qs_rank = 999
            has_admission_offer = 1 if random.random() < 0.90 else 0
            study_country = 'India'
            
            # NFST: min marks 55%, masters/phd, valid admission
            eligible = 1 if (marks >= 55.0 and edu_level in ['masters', 'phd'] and has_admission_offer) else 0
            
        else: # AZKMI - National Overseas Scholarship (NOS)
            age = random.randint(21, 38)
            edu_level = random.choice(['masters', 'phd', 'postdoc'])
            marks = round(random.uniform(50.0, 95.0), 1)
            income = round(random.uniform(100000, 1000000), -3)
            foreign_tuple = random.choice(FOREIGN_UNIVERSITIES)
            institute, qs_rank = foreign_tuple[0], foreign_tuple[1]
            nirf = 999
            has_admission_offer = 1 if random.random() < 0.85 else 0
            study_country = random.choice(['United Kingdom', 'USA', 'Germany', 'Australia', 'Singapore', 'Canada'])
            
            # NOS Rule: Income <= 6.0L, Age <= 35, Marks >= 55%, QS <= 500, Unconditional Offer
            eligible = 1 if (income <= 600000 and age <= 35 and marks >= 55.0 and qs_rank <= 500 and has_admission_offer) else 0
            
        # OCR Verifications
        ocr_caste_ok = 1 if random.random() < 0.94 else 0
        ocr_income_ok = 1 if random.random() < 0.92 else 0
        ocr_academic_ok = 1 if random.random() < 0.95 else 0
        
        # Overall status
        if eligible and ocr_caste_ok and ocr_income_ok and ocr_academic_ok:
            decision = 'Eligible'
        elif eligible and (not ocr_income_ok or not ocr_academic_ok):
            decision = 'Borderline'
        else:
            decision = 'Ineligible'
            
        # Merit Score calculation (0 - 100)
        # Academic (40 pts) + Prestige (25 pts) + Income Need (20 pts) + Diversity/Gender (10 pts) + PwD (5 pts)
        acad_score = min(40.0, (marks / 100.0) * 40.0)
        
        if scheme_code == 'AZKMI':
            prestige_score = 25.0 if qs_rank <= 50 else (20.0 if qs_rank <= 200 else (15.0 if qs_rank <= 500 else 5.0))
        else:
            prestige_score = 25.0 if nirf <= 10 else (20.0 if nirf <= 50 else (15.0 if nirf <= 100 else 8.0))
            
        if income <= 200000:
            income_score = 20.0
        elif income <= 400000:
            income_score = 15.0
        elif income <= 600000:
            income_score = 10.0
        else:
            income_score = 5.0
            
        div_score = 10.0 if gender == 'female' else 5.0
        pwd_score = 5.0 if is_pwd else 0.0
        
        merit_score = round(min(100.0, acad_score + prestige_score + income_score + div_score + pwd_score), 2)
        
        rows.append({
            'scheme_code': scheme_code,
            'age': age,
            'gender': gender,
            'state': state,
            'education_level': edu_level,
            'marks_percent': marks,
            'family_income': income,
            'nirf_rank': nirf,
            'qs_rank': qs_rank,
            'has_admission_offer': has_admission_offer,
            'is_pwd': is_pwd,
            'pwd_percent': pwd_percent,
            'ocr_caste_ok': ocr_caste_ok,
            'ocr_income_ok': ocr_income_ok,
            'ocr_academic_ok': ocr_academic_ok,
            'merit_score': merit_score,
            'decision': decision
        })
        
    df = pd.DataFrame(rows)
    return df

def generate_fraud_dataset(num_samples=8000):
    rows = []
    
    for _ in range(num_samples):
        is_fraud = 1 if random.random() < 0.15 else 0
        
        if is_fraud:
            ocr_text_similarity = round(random.uniform(0.20, 0.65), 3)
            income_discrepancy_ratio = round(random.uniform(1.8, 5.0), 2)
            marks_discrepancy = round(random.uniform(10.0, 35.0), 1)
            duplicate_cert_count = random.choice([2, 3, 4, 5])
            duplicate_bank_count = random.choice([2, 3, 4])
            fuzzy_name_match_score = round(random.uniform(0.30, 0.70), 2)
            certificate_tamper_flag = 1 if random.random() < 0.70 else 0
            risk_label = 'High_Risk' if random.random() < 0.75 else 'Suspicious'
        else:
            ocr_text_similarity = round(random.uniform(0.85, 0.99), 3)
            income_discrepancy_ratio = round(random.uniform(0.95, 1.05), 2)
            marks_discrepancy = round(random.uniform(0.0, 2.0), 1)
            duplicate_cert_count = 1
            duplicate_bank_count = 1
            fuzzy_name_match_score = round(random.uniform(0.90, 1.00), 2)
            certificate_tamper_flag = 0
            risk_label = 'Normal'
            
        rows.append({
            'ocr_text_similarity': ocr_text_similarity,
            'income_discrepancy_ratio': income_discrepancy_ratio,
            'marks_discrepancy': marks_discrepancy,
            'duplicate_cert_count': duplicate_cert_count,
            'duplicate_bank_count': duplicate_bank_count,
            'fuzzy_name_match_score': fuzzy_name_match_score,
            'certificate_tamper_flag': certificate_tamper_flag,
            'is_fraud': is_fraud,
            'risk_label': risk_label
        })
        
    df = pd.DataFrame(rows)
    return df

if __name__ == '__main__':
    os.makedirs('ml/data', exist_ok=True)
    
    print("Generating MoTA Scholarship Dataset based on tribal.nic.in & dbttribal.gov.in rules...")
    df_scholarship = generate_scholarship_dataset(12000)
    df_scholarship.to_csv('ml/data/mota_schemes_dataset.csv', index=False)
    print(f" Saved {len(df_scholarship)} scholarship training samples to ml/data/mota_schemes_dataset.csv")
    
    print("Generating MoTA Fraud & Discrepancy Dataset...")
    df_fraud = generate_fraud_dataset(8000)
    df_fraud.to_csv('ml/data/mota_fraud_detection_dataset.csv', index=False)
    print(f" Saved {len(df_fraud)} fraud training samples to ml/data/mota_fraud_detection_dataset.csv")
