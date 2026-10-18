# 🌍 EnviroWatch AI

Environmental monitoring and decision support for Pune and Mumbai: live-style readings across 7 environmental pillars, alerts, 48-hour forecasts, an ML risk forecaster, a what-if simulator and a construction site suitability analyzer.

> **Data note:** the dataset is **simulated**: 10,000 readings across 20 locations (10 per city) for one day (17 Feb 2026), 70 parameters each. Model scores show the pipeline works; they are not real-world accuracy figures.

## ✨ Features

| Feature | What it does |
|---|---|
| **Dashboard** | AQI plus 7 pillars (air, water, noise, emissions, waste, urban heat, groundwater), AI insights and recommendations |
| **AI Risk Forecast** | Random Forest + XGBoost ensemble predicting the average risk level for the **next 3 hours**; hazardous air is always forecast Critical |
| **Anomaly detection** | Physical-limit and range checks plus an Isolation Forest to flag faulty sensor readings |
| **Alerts** | Threshold breaches with severity and the responsible authority (CPCB, MPCB, PMC/BMC) |
| **48-hour forecast** | Per-pillar forecast with breach hours and peak time |
| **Risk map** | Current AQI risk for every location in the selected city (Leaflet + OpenStreetMap) |
| **What-if simulator** | Impact of traffic, industry, wind, rainfall, festivals and green cover on all pillars |
| **Site analyzer** | Suitability of 12 building types (hospital, school, factory…) with graded scoring, violations, alternatives and FSI/TDR analysis |
| **Grievances** | Citizens report issues and get a tracking ID (stored in Supabase in database mode) |

## 🏗️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router 7, Recharts, Leaflet, Axios, Zustand
- **Backend:** FastAPI, Pandas, scikit-learn, XGBoost, Supabase (Auth + PostgreSQL)

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 20+

### 1. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then fill in your Supabase keys
python scripts/train_all_models.py   # once, about 1 minute
uvicorn app.main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env              # then fill in your Supabase URL and anon key
npm run dev
```

Open http://localhost:3000. API docs are at http://localhost:8000/docs.

### 3. Database (optional)
By default the backend reads the bundled CSV. To serve data from Supabase:
1. Run `scripts/supabase_schema.sql` in the Supabase SQL Editor.
2. `cd backend && python scripts/migrate_and_seed.py` adds the remaining columns and uploads the 10,000 readings.
3. Set `DATA_SOURCE=supabase` in `backend/.env`.

Startup then takes 10–30 seconds while readings load. If the database can't be reached, the backend falls back to the CSV.

For password-reset emails to work, add `http://localhost:3000/reset-password` under **Supabase → Authentication → URL Configuration → Redirect URLs**.

## 🔐 Demo Login

Any email ending in **`@demo.com`** with any password, for example `demo@demo.com`. Demo accounts skip Supabase; their profile is saved in the browser. Other emails use real Supabase sign-up and login.

## 🧪 Tests & Lint

```bash
cd backend && pytest            # 25 tests; always uses the CSV, never the database
cd frontend && npm run lint
```

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── core/            # Settings (.env)
│   │   ├── db/              # Supabase client, env_readings loader
│   │   ├── ml/              # Risk forecaster, anomaly detector, features
│   │   ├── schemas/         # Pydantic models
│   │   └── services/        # Data layer, alerts, forecasts
│   ├── data/                # Simulated dataset (CSV)
│   ├── scripts/             # Model training, DB migration + seeding
│   └── tests/
├── frontend/src/
│   ├── components/          # Layout, ErrorBoundary
│   ├── pages/               # One file per screen
│   ├── services/            # API client, Supabase client
│   └── store/               # Zustand state
├── scripts/                 # SQL schema and migrations
├── poster/                  # Project poster
└── docs/API.md
```

## 🔧 Main API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login`, `/api/auth/register` | Authentication |
| GET | `/api/locations/list` | Cities and locations |
| GET | `/api/dashboard/summary`, `/ai-insights`, `/city-overview` | Dashboard data |
| GET | `/api/alerts/active` | Active alerts |
| GET | `/api/forecast/48hr/{location}` | 48-hour forecast |
| GET | `/api/ml/predict-risk`, `/detect-anomaly`, `/model-info` | Machine learning |
| POST | `/api/simulation/predict-impact` | What-if simulation |
| GET | `/api/site-analysis/analyze`, `/construction-types` | Site suitability |
| POST / GET | `/api/grievance/submit`, `/status/{tracking_id}` | Grievances |

Full reference: [`docs/API.md`](docs/API.md) or the live docs at `/docs`.

## 📚 More Documentation

- [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md): architecture and ML details
- [`EXPLANATION.md`](EXPLANATION.md): how a request flows through the system
