"""
generate_doc_classifier_dataset.py

Generates a synthetic training set for the document-type text classifier.
Each row is (text, label). Labels are the 7 real document types plus
'unknown' for everything that should NOT be confidently classified.

The 'unknown' class is the important part: it's deliberately stuffed with
text that incidentally contains a real keyword out of context (e.g. a news
headline mentioning "university", a UI settings screen mentioning "income
summary"). This is exactly the failure mode found in manual testing, where
a single incidental keyword match made the old keyword-matcher confidently
mislabel random screenshots as specific certificates. Training on these
as explicit negatives teaches the model that one incidental word is not
enough evidence.
"""
import csv
import random

random.seed(42)

NAMES = ["Rahul Kumar", "Sunita Munda", "Amit Oraon", "Priya Soren", "Vikram Bhil",
         "Anita Gond", "Suresh Meena", "Kavita Naik", "Deepak Toppo", "Rekha Minz"]
STATES = ["Jharkhand", "Odisha", "Chhattisgarh", "Madhya Pradesh", "Maharashtra",
          "Rajasthan", "Gujarat", "West Bengal", "Andhra Pradesh", "Telangana"]
DISTRICTS = ["Ranchi", "Khunti", "Simdega", "Gumla", "Koraput", "Bastar", "Dhar",
             "Nashik", "Udaipur", "Dahod"]
AUTHORITIES = ["Tehsildar", "Tahsildar", "Sub-Divisional Magistrate", "District Magistrate",
               "Revenue Officer", "Taluk Executive Magistrate"]
UNIVERSITIES = ["University of Melbourne", "Oxford University", "Imperial College London",
                "Harvard University", "University of Toronto", "National Institute of Technology",
                "Indian Institute of Technology Delhi", "Anna University", "Jadavpur University"]
COUNTRIES = ["United Kingdom", "United States", "Australia", "Canada", "Germany", "Singapore"]
PROGRAMMES = ["Master of Data Science", "PhD in Computer Science", "Master of Public Policy",
              "MSc Renewable Energy", "PhD in Biotechnology", "Master of Social Work"]
BANKS = ["State Bank of India", "Bank of Baroda", "Punjab National Bank", "Canara Bank",
         "Union Bank of India", "Bank of India"]

def rand_date():
    d, m, y = random.randint(1, 28), random.randint(1, 12), random.randint(2019, 2025)
    return f"{d:02d}/{m:02d}/{y}"

def rand_cert_no():
    return f"{random.choice(['ST','CERT','REF'])}/{random.choice(STATES)[:2].upper()}/{random.randint(2019,2025)}/{random.randint(1000,9999)}"

def rand_account():
    return str(random.randint(10**10, 10**16))

def rand_ifsc():
    bank_code = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=4))
    return f"{bank_code}0{random.randint(100000,999999)}"

def rand_aadhaar():
    return " ".join(str(random.randint(1000, 9999)) for _ in range(3))

# ---------- Positive templates per document type ----------

def gen_caste_certificate():
    name = random.choice(NAMES)
    dist = random.choice(DISTRICTS)
    state = random.choice(STATES)
    auth = random.choice(AUTHORITIES[:3])
    templates = [
        f"GOVERNMENT OF {state.upper()}\nOFFICE OF THE {auth.upper()}, {dist.upper()}\nCASTE CERTIFICATE\nCertificate Number: {rand_cert_no()}\nDate of Issue: {rand_date()}\nThis is to certify that {name}, residing at {dist}, District {dist}, {state} belongs to a community recognized as a Scheduled Tribe (ST) under the Constitution (Scheduled Tribes) Order, 1950.\nIssuing Authority: {auth}",
        f"TRIBE CERTIFICATE\nRef No: {rand_cert_no()}\nCertified that Shri {name} son/daughter of resident of {dist}, {state}, belongs to Scheduled Tribe category as per the Constitution (Scheduled Tribes) Order.\nIssued by: {auth}, {dist}",
        f"This is to certify that {name} belongs to the Scheduled Tribe community. Category: Scheduled Tribe (ST). Issued by Sub-Divisional Magistrate, {dist}, dated {rand_date()}.",
    ]
    return random.choice(templates)

def gen_income_certificate():
    name = random.choice(NAMES)
    auth = random.choice(["Tahsildar", "Revenue Officer", "District Collector"])
    income = random.choice([85000, 120000, 145000, 190000, 240000, 275000])
    templates = [
        f"INCOME CERTIFICATE\nCertificate No: {rand_cert_no()}\nDate: {rand_date()}\nThis is to certify that the annual income of the family of {name} is Rs. {income:,} (Rupees only) from all sources.\nFamily Income verified by {auth}.",
        f"GOVERNMENT OFFICE OF THE {auth.upper()}\nThis is to certify {name}'s gross income for the financial year is Rs {income:,}. Annual income certificate issued as per revenue records.",
        f"Certified that the total annual income of {name} and family is Rs. {income:,}. Issued by {auth} on {rand_date()}.",
    ]
    return random.choice(templates)

def gen_marksheet():
    uni = random.choice(UNIVERSITIES)
    pct = round(random.uniform(55, 96), 2)
    templates = [
        f"STATEMENT OF MARKS\n{uni}\nController of Examinations\nRoll No: RU/{random.randint(2020,2024)}/ST/{random.randint(100,999)}\nPercentage: {pct}%\nYear of Passing: {random.randint(2020,2024)}",
        f"GRADE SHEET\n{uni}\nCGPA: {round(pct/9.5, 2)}\nSemester: {random.randint(1,8)}\nMarks obtained: {int(pct*5)}/500",
        f"Marksheet issued by {uni}. Total percentage: {pct}%. Registration No: {random.randint(100000,999999)}. Session {random.randint(2019,2024)}-{random.randint(2020,2025)}.",
    ]
    return random.choice(templates)

def gen_offer_letter():
    uni = random.choice(UNIVERSITIES)
    country = random.choice(COUNTRIES)
    prog = random.choice(PROGRAMMES)
    templates = [
        f"{uni}\nLetter of Acceptance\nDear Applicant, we are pleased to offer you Conditional Offer of admission to {prog}, Faculty of Graduate Studies. Tuition fee: approx $40,000 per year. Commencement: September intake.",
        f"OFFER LETTER\n{uni}, {country}\nThis is an Unconditional Offer for admission to {prog}. Please confirm acceptance and pay the tuition fee deposit to secure your seat.",
        f"Admission Offer - {uni}\nProgramme: {prog}\nCountry: {country}\nWe are delighted to extend this offer letter for the upcoming academic year.",
    ]
    return random.choice(templates)

def gen_bank_passbook():
    bank = random.choice(BANKS)
    templates = [
        f"{bank}\nSAVINGS BANK PASSBOOK\nAccount Number: {rand_account()}\nIFSC: {rand_ifsc()}\nBranch Code: {random.randint(1000,9999)}\nAccount Holder: {random.choice(NAMES)}",
        f"Bank Statement\n{bank}, Branch\nA/c No: {rand_account()}\nIFSC Code: {rand_ifsc()}\nName: {random.choice(NAMES)}\nSaving Bank Account",
        f"PASSBOOK\n{bank}\nAccount held by {random.choice(NAMES)}. Account number {rand_account()}. IFSC {rand_ifsc()}.",
    ]
    return random.choice(templates)

def gen_aadhaar():
    templates = [
        f"Government of India\nUnique Identification Authority of India\nUIDAI\nAadhaar {rand_aadhaar()}\nMera Aadhaar, Meri Pehchaan\nName: {random.choice(NAMES)}",
        f"AADHAAR CARD\n{random.choice(NAMES)}\nUIDAI\nEnrolment No: {random.randint(1000,9999)}/{random.randint(10000,99999)}/{random.randint(10000,99999)}\n{rand_aadhaar()}",
    ]
    return random.choice(templates)

def gen_college_id():
    templates = [
        f"STUDENT ID CARD\n{random.choice(UNIVERSITIES)}\nName: {random.choice(NAMES)}\nRoll No: {random.randint(1000,9999)}\nValid Upto: {rand_date()}",
        f"COLLEGE ID\nLibrary Card No: LIB{random.randint(1000,9999)}\nIdentity Card issued to {random.choice(NAMES)}, valid upto {rand_date()}.",
    ]
    return random.choice(templates)

POSITIVE_GENERATORS = {
    "caste_certificate": gen_caste_certificate,
    "income_certificate": gen_income_certificate,
    "marksheet": gen_marksheet,
    "offer_letter": gen_offer_letter,
    "bank_passbook": gen_bank_passbook,
    "aadhaar": gen_aadhaar,
    "college_id": gen_college_id,
}

# ---------- Negative ("unknown") examples ----------
# Deliberately includes incidental overlap with real keywords, out of context.

UNKNOWN_TEMPLATES = [
    "Settings > Notifications > Monthly income summary chart preview toggle dark mode",
    "Top 10 productivity apps every university student should try in {year} - TechBlog",
    "Screenshot of a WhatsApp group chat about weekend plans and cricket scores",
    "Instagram post: Beautiful sunset at the beach today! #travel #vacation #blessed",
    "Error 404 - Page not found. Please check the URL and try again.",
    "Recipe: How to make butter chicken at home in under 30 minutes",
    "Weather forecast for tomorrow: partly cloudy with a chance of rain in the afternoon",
    "News headline: Stock market income growth surges as tech university enrolments rise this semester",
    "Meme template with bold white text on a grey background, no visible document content",
    "YouTube video thumbnail preview of a gaming livestream with subscriber count overlay",
    "Random Wikipedia excerpt about the history of the university of Bologna founded in 1088",
    "A screenshot of a to-do list app showing tasks: buy groceries, pay electricity bank of statement, call mom",
    "Amazon order confirmation: Your package containing a bank statement organizer folder has shipped",
    "Blank white image with faint watermark text, mostly illegible pixel noise qwpicture unreadable",
    "Product review: This laptop has great battery percentage remaining after 10 hours of use",
    "Group photo caption: Our college id trip to the mountains was unforgettable, best semester ever",
    "Spam text message: Congratulations! You have won a prize, click here to claim your offer letter now",
    "Google Maps screenshot showing directions to the nearest university campus food court",
    "Text overlay from a cooking show: add a pinch of salt and stir the percentage of spices evenly",
    "Random forum post: does anyone know how to increase my monthly income working from home",
]

def gen_unknown():
    t = random.choice(UNKNOWN_TEMPLATES)
    return t.replace("{year}", str(random.randint(2024, 2027)))

def build_dataset(n_per_positive=220, n_negative=900):
    rows = []
    for label, gen in POSITIVE_GENERATORS.items():
        for _ in range(n_per_positive):
            rows.append((gen(), label))
    for _ in range(n_negative):
        rows.append((gen_unknown(), "unknown"))
    random.shuffle(rows)
    return rows

if __name__ == "__main__":
    rows = build_dataset()
    out_path = "ml/data/document_classification_dataset.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label"])
        writer.writerows(rows)
    print(f"Generated {len(rows)} rows -> {out_path}")
    from collections import Counter
    print(Counter(label for _, label in rows))
