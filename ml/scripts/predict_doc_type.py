"""
predict_doc_type.py

CLI inference for the document-type text classifier.
Usage: python3 ml/scripts/predict_doc_type.py '{"text": "raw OCR text..."}'
Prints JSON: {"type": "...", "confidence": 0-97, "topCandidates": [...]}

Confidence is the classifier's own predict_proba for the winning class,
scaled to a 0-97 integer (never claims 100% certainty). Two additional
safeguards beyond the raw model output:
  - Text shorter than MIN_TEXT_LENGTH is rejected as unclassifiable before
    even calling the model (too thin to say anything reliable).
  - If the top two classes are within MIN_MARGIN of each other, the result
    is downgraded to 'unknown' - a close call between two types is treated
    as genuinely ambiguous rather than guessed at.
The model was trained to predict 'unknown' directly for non-certificate
text, so a low-confidence guess also naturally routes to 'unknown' if the
model itself isn't confident.
"""
import sys
import json
import warnings
import joblib

warnings.filterwarnings("ignore")

MODEL_PATH = "ml/models/document_classifier.joblib"
MIN_TEXT_LENGTH = 40
MIN_CONFIDENT_PROB = 0.55
MIN_MARGIN = 0.15

_model = None

def get_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model

def predict_doc_type(text):
    if not text or len(text.strip()) < MIN_TEXT_LENGTH:
        return {"type": "unknown", "confidence": 0, "topCandidates": []}

    model = get_model()
    proba = model.predict_proba([text])[0]
    classes = model.classes_
    ranked = sorted(zip(classes, proba), key=lambda x: x[1], reverse=True)

    top_label, top_prob = ranked[0]
    runner_label, runner_prob = ranked[1] if len(ranked) > 1 else (None, 0.0)

    top_candidates = [{"type": c, "confidence": round(float(p) * 100, 1)} for c, p in ranked[:3]]

    if top_label == "unknown":
        return {"type": "unknown", "confidence": 0, "topCandidates": top_candidates}

    if top_prob < MIN_CONFIDENT_PROB:
        return {"type": "unknown", "confidence": 0, "topCandidates": top_candidates}

    if (top_prob - runner_prob) < MIN_MARGIN:
        # Two types are nearly equally likely - genuinely ambiguous
        return {"type": "unknown", "confidence": 0, "topCandidates": top_candidates}

    confidence = min(97, round(top_prob * 100))
    return {"type": top_label, "confidence": confidence, "topCandidates": top_candidates}

if __name__ == "__main__":
    try:
        payload = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        result = predict_doc_type(payload.get("text", ""))
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"type": "unknown", "confidence": 0, "topCandidates": [], "error": str(e)}))
