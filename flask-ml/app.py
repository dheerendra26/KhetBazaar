"""
KhetBazaar – Flask ML Service v3
Strict real-data mode:
  - /predict           { crop, day, month, year } → predicted price for that date
  - /predict-tomorrow  { crop }                   → predicted price for tomorrow only
  - /health
  - /retrain

REMOVED: predict-timeline (Node.js handles this now using MongoDB directly)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from pymongo import MongoClient
from datetime import datetime, timedelta
import pickle
from dotenv import load_dotenv

load_dotenv()


app = Flask(__name__)

if __name__ == "__main__":
    app.run()

CORS(app)

MONGO_URI = os.getenv("MONGO_URI")
MODEL_PATH   = "model.pkl"
ENCODER_PATH = "encoder.pkl"

# ── DB helpers ─────────────────────────────────────────────────────────────────

def get_db():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    return client["test"]

def load_data():
    db      = get_db()
    records = list(db["mandiprices"].find({}, {"_id": 0}))
    if not records:
        return None
    df = pd.DataFrame(records)
    df.columns = [c.lower() for c in df.columns]
    return df

# ── Model training ─────────────────────────────────────────────────────────────

def train_model():
    df = load_data()
    if df is None or df.empty:
        print("[ML] No data in DB – cannot train.")
        return None, None

    required = {"commodity", "day", "month", "year", "modal_price"}
    if not required.issubset(df.columns):
        print(f"[ML] Missing columns: {df.columns.tolist()}")
        return None, None

    df = df.dropna(subset=list(required))
    df["modal_price"] = pd.to_numeric(df["modal_price"], errors="coerce")
    df = df[df["modal_price"] > 0].dropna(subset=["modal_price"])

    le = LabelEncoder()
    df["crop_encoded"] = le.fit_transform(df["commodity"].astype(str).str.lower().str.strip())

    X = df[["crop_encoded", "day", "month", "year"]].values
    y = df["modal_price"].values

    rf = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
    rf.fit(X, y)

    with open(MODEL_PATH,   "wb") as f: pickle.dump(rf, f)
    with open(ENCODER_PATH, "wb") as f: pickle.dump(le, f)

    print(f"[ML] Trained on {len(df)} rows covering {df['commodity'].nunique()} crops.")
    return rf, le

def load_or_train():
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        with open(MODEL_PATH,   "rb") as f: rf = pickle.load(f)
        with open(ENCODER_PATH, "rb") as f: le = pickle.load(f)
        print("[ML] Loaded saved model.")
        return rf, le
    return train_model()

rf_model, label_enc = None, None

# ── Crop resolution ────────────────────────────────────────────────────────────

# ── Display name → Agmarknet name aliases ─────────────────────────────────────
# The Node.js seed script stores records under normalised display names
# (e.g. "arhar dal"), but older seeds may have stored them under the raw API
# name (e.g. "arhar(tur/red gram)(whole)").  The ML model is trained on whatever
# names are in the DB, so we resolve display names → likely training names here.
CROP_DISPLAY_ALIASES = {
    "arhar dal":  ["arhar(tur/red gram)(whole)", "tur", "arhar dal"],
    "chana dal":  ["bengal gram(split)", "gram(split)", "chana dal", "gram"],
    "masoor dal": ["lentil", "masur(whole)", "masoor dal"],
    "urad dal":   ["black gram(urd beans)(whole)", "urad(whole)", "urad dal"],
    "moong dal":  ["green gram(whole)", "moong(whole)", "moong dal"],
    "soybean":    ["soybean", "soya bean", "soyabean"],
    "groundnut":  ["groundnut", "groundnut (with shell)"],
    "mustard":    ["mustard", "mustard seeds(black)"],
    "bajra":      ["bajra", "pearl millet"],
    "ladyfinger": ["ladyfinger", "bhindi(ladies finger)"],
    "brinjal":    ["brinjal", "brinjal(vankaya)"],
    "pomegranate":["pomegranate", "anar"],
    "maize":      ["maize", "corn"],
}

def resolve_crop(crop_raw):
    """Return (resolved_crop_str, error_dict_or_None)."""
    if rf_model is None:
        return None, {"error": "Model not ready"}
    crop  = str(crop_raw).strip().lower()
    known = list(label_enc.classes_)

    # Exact match first
    if crop in known:
        return crop, None

    # Try display-name aliases (covers pulse crops like "arhar dal" → "arhar(tur/red gram)(whole)")
    for alias in CROP_DISPLAY_ALIASES.get(crop, []):
        if alias in known:
            return alias, None

    # Fuzzy: partial match against known names
    matches = [c for c in known if crop in c or c in crop]
    if matches:
        return matches[0], None

    return None, {
        "error": f"Crop '{crop}' not in training data.",
        "available_crops": known[:40],
        "hint": "Run seed-mandi.js then POST /retrain to include this crop.",
    }

def predict_price_for(crop_encoded, day, month, year):
    X     = np.array([[crop_encoded, day, month, year]])
    raw   = rf_model.predict(X)[0]
    price = float(raw)
    if not np.isfinite(price) or price <= 0:
        raise ValueError(f"Model returned invalid price: {raw!r}")
    return round(price, 2)

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    n_crops = len(label_enc.classes_) if label_enc is not None else 0
    return jsonify({
        "status":      "ok",
        "model_ready": rf_model is not None,
        "n_crops":     n_crops,
    })


@app.route("/retrain", methods=["POST"])
def retrain():
    global rf_model, label_enc
    for p in [MODEL_PATH, ENCODER_PATH]:
        if os.path.exists(p): os.remove(p)
    rf_model, label_enc = train_model()
    if rf_model is None:
        return jsonify({"error": "Training failed – seed mandi data first."}), 500
    return jsonify({"message": "Model retrained successfully", "n_crops": len(label_enc.classes_)})


@app.route("/predict", methods=["POST"])
def predict():
    """Predict price for a specific crop + date."""
    global rf_model, label_enc
    if rf_model is None:
        rf_model, label_enc = load_or_train()
    if rf_model is None:
        return jsonify({"error": "Model not available. Run seed-mandi.js first."}), 503

    body = request.get_json(force=True)
    now  = datetime.now()

    # Validate and coerce date fields — bad inputs return 400 not 500
    try:
        day   = int(body.get("day",   now.day))
        month = int(body.get("month", now.month))
        year  = int(body.get("year",  now.year))
        if not (1 <= day <= 31 and 1 <= month <= 12 and 2000 <= year <= 2100):
            raise ValueError("Date out of range")
    except (TypeError, ValueError) as e:
        return jsonify({"error": f"Invalid date fields: {e}"}), 400

    crop, err = resolve_crop(body.get("crop", ""))
    if err:
        return jsonify(err), 404

    try:
        enc   = label_enc.transform([crop])[0]
        price = predict_price_for(enc, day, month, year)
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    return jsonify({
        "crop":            crop,
        "day":             day,
        "month":           month,
        "year":            year,
        "predicted_price": price,
        "unit":            "INR per quintal",
        "source":          "ml_predicted",
    })


@app.route("/predict-tomorrow", methods=["POST"])
def predict_tomorrow():
    """
    Predict tomorrow's price for a crop.
    Body: { crop: "tomato" }
    """
    global rf_model, label_enc
    if rf_model is None:
        rf_model, label_enc = load_or_train()
    if rf_model is None:
        return jsonify({"error": "Model not available. Run seed-mandi.js first."}), 503

    body = request.get_json(force=True)
    crop, err = resolve_crop(body.get("crop", ""))
    if err:
        return jsonify(err), 404

    tomorrow = datetime.now() + timedelta(days=1)

    try:
        enc   = label_enc.transform([crop])[0]
        price = predict_price_for(enc, tomorrow.day, tomorrow.month, tomorrow.year)
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    return jsonify({
        "crop":            crop,
        "date":            tomorrow.strftime("%d/%m/%Y"),
        "predicted_price": price,
        "unit":            "INR per quintal",
        "source":          "ml_predicted",
    })


# Keep /predict-timeline for backward compat — but now Node.js doesn't call it
@app.route("/predict-timeline", methods=["POST"])
def predict_timeline():
    """Legacy endpoint — Node.js v3 no longer uses this."""
    global rf_model, label_enc
    if rf_model is None:
        rf_model, label_enc = load_or_train()
    if rf_model is None:
        return jsonify({"error": "Model not available."}), 503

    body = request.get_json(force=True)
    crop, err = resolve_crop(body.get("crop", ""))
    if err:
        return jsonify(err), 404

    enc      = label_enc.transform([crop])[0]
    today    = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)

    return jsonify({
        "crop":     crop,
        "tomorrow": {
            "date":   tomorrow.strftime("%d/%m/%Y"),
            "price":  predict_price_for(enc, tomorrow.day, tomorrow.month, tomorrow.year),
            "source": "ml_predicted",
        },
    })


if __name__ == "__main__":
    rf_model, label_enc = load_or_train()
    port = int(os.environ.get("FLASK_PORT", 5001))
    print(f"[Flask] Starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
