# KhetBazaar – Flask ML Service

## Setup

```bash
cd flask-ml
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
MONGO_URI=mongodb://localhost:27017/khetbazaar python app.py
```

Runs on port **5001** by default. Set `FLASK_PORT` env var to change.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Check if model is ready |
| POST | `/predict` | Predict modal price |
| POST | `/retrain` | Force model retrain from DB data |

### POST /predict

**Request body:**
```json
{ "crop": "tomato", "day": 15, "month": 6, "year": 2025 }
```

**Response:**
```json
{
  "crop": "tomato",
  "day": 15, "month": 6, "year": 2025,
  "predicted_price": 1450.75,
  "unit": "INR per quintal"
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017/khetbazaar` | MongoDB connection string |
| `FLASK_PORT` | `5001` | Port to listen on |
