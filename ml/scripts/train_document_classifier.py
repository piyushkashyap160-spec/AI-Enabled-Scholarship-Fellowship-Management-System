"""
train_document_classifier.py

Trains a real text classifier (TF-IDF + Logistic Regression) to identify
document type from OCR-extracted text, replacing the old keyword-substring
heuristic. Includes an explicit 'unknown' class so the model learns to
reject text that doesn't genuinely match any certificate type, instead of
confidently guessing off one incidental keyword.
"""
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score

DATA_PATH = "ml/data/document_classification_dataset.csv"
MODEL_PATH = "ml/models/document_classifier.joblib"

def main():
    df = pd.read_csv(DATA_PATH)
    X_train, X_test, y_train, y_test = train_test_split(
        df["text"], df["label"], test_size=0.2, random_state=42, stratify=df["label"]
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, lowercase=True)),
        ("clf", LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42))
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Held-out test accuracy: {acc:.4f}\n")
    print(classification_report(y_test, y_pred))

    joblib.dump(pipeline, MODEL_PATH)
    print(f"Saved model -> {MODEL_PATH}")

if __name__ == "__main__":
    main()
