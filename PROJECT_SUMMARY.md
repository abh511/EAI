# EnviroWatch AI — Project Summary

## What Is This?

EnviroWatch AI is an AI-powered environmental monitoring and decision support system built for Indian cities (Pune & Mumbai). It tracks 7 environmental pillars in real-time, predicts risks, and helps urban planners and citizens make data-driven decisions.

Built for a hackathon. Stack: FastAPI + React + Supabase + ML ensemble.

---

## Project Structure

```
envirowatch-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point, CORS, router registration
│   │   ├── core/config.py       # Pydantic settings, reads from .env
│   │   ├── api/routes/          # All API endpoints (10 route files)
│   │   ├── services/__init__.py # Data layer — loads readings (Supabase or CSV), alerts/forecasts
│   │   └── ml/                  # ML models and feature engineering
│   ├── data/                    # 10,000-row environmental dataset (70 columns)
│   ├── scripts/                 # Training scripts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # 13 page components
│   │   ├── components/          # Layout, ErrorBoundary, UI
│   │   ├── services/api.js      # Axios instance, all API calls
│   │   └── store/useAppStore.js # Zustand global state (city, location, user)
│   └── vite.config.js           # Proxy: /api → localhost:8000
└── scripts/supabase_schema.sql  # DB schema + seed data
```

---

## The Dataset

- File: `backend/data/pune_mumbai_environmental_data_17022026.csv`
- 10,000 rows × 70 columns
- Cities: Pune (10 locations), Mumbai (10 locations)
- Parameters cover all 7 pillars: air, water, noise, industrial, waste, heat, groundwater
- Key columns: `aqi_us`, `pm2_5_ug_m3`, `water_quality_index`, `noise_day_dba`, `nox_ug_m3`, `gw_tds_mg_l`, `ambient_temp_celsius`, `traffic_density`, `industrial_proximity_km`, etc.

With `DATA_SOURCE=supabase` (backend/.env) the same 10,000 rows are loaded from the `env_readings` table at startup (~10 s), falling back to the CSV if the database is unreachable. With `DATA_SOURCE=csv` the file is read directly. `get_latest_reading()` does a random sample from the filtered location rows to simulate "live" data.

---

## ML Models

> **Note:** the dataset is **simulated** data for Pune and Mumbai: one day (17 Feb 2026), about 500 readings per location. The model results below show the pipeline works; they are not evidence of real-world accuracy.

### 1. Risk Forecaster (`backend/app/ml/risk_classifier.py`)

**What it does:** Forecasts the **average risk level over the next 3 hours** (Low / Medium / High / Critical) for a location.

**Why a forecast:** the *current* risk class comes straight from the AQI formula applied to PM2.5, so a model trained on it just re-learns that formula (it scored 99.75% while learning nothing). Current risk is now computed directly from the formula, and the model predicts what isn't known yet.

**Architecture:** Soft-voting ensemble of Random Forest (300 trees) and XGBoost (300 estimators, depth 4), trained with balanced class weights so rare classes count.

**Inputs (12):** current AQI, average AQI over the last hour, PM2.5, PM10, NO₂, CO, wind speed, rainfall, traffic density, humidity, time of day (sin/cos).

**Evaluation:** time-based split (train on earlier readings, test on the latest 25%). A random split would leak, since readings minutes apart are nearly identical. The model is compared with a simple baseline, "the next 3 hours look like the last hour":

| | Accuracy | Balanced accuracy | Macro F1 |
|---|---|---|---|
| ML ensemble | 87.5% | **91.4%** | **83.3%** |
| Baseline (last hour) | 87.9% | 80.3% | 80.4% |

It catches 97.6% of upcoming High-risk periods, at the cost of some false alarms (61% precision).

**Safety rule:** the data has no 3-hour periods averaging Critical, so the model cannot learn that class. If the air is hazardous right now (AQI > 300), the forecast is forced to Critical (`safety_override: true`).

**Saved to:** `backend/app/ml/models/risk_classifier.pkl`, metrics in `risk_classifier_metrics.json`

---

### 2. Anomaly Detector (`backend/app/ml/anomaly_detector.py`)

**What it does:** Flags unusual environmental readings, such as a sensor malfunction or an extraordinary event.

**Two layers:**
1. **Rule checks:** physically impossible values (for example pH outside 0–14, or noise above 130 dB), and values far outside the range seen in training (stored in `anomaly_bounds.json`). Isolation Forest alone misses these, because trees treat any value beyond the training range like the most extreme training value.
2. **Isolation Forest** (100 estimators, contamination 5%) on 30 features, for unusual *combinations* of normal-looking values.

**Output:** `is_anomaly`, `anomaly_score`, `reasons` (which rules failed) and `detected_by`.

**Saved to:** `backend/app/ml/models/anomaly_detector.pkl`

---

### 3. Feature Engineering Pipeline (`backend/app/ml/feature_engineering.py`)

- **Forecasting:** `build_forecast_frame()` builds the 3-hour-ahead target per location; `forecast_features()` builds the same inputs for a live prediction. Also holds `pm25_to_aqi()` (EPA breakpoints, truncated to one decimal so values like 35.45 don't fall between breakpoints).
- **Anomaly detector preprocessing:**
1. **Derived features** — `pm_ratio`, `nox_sox_ratio`, `water_pollution_score`, `noise_violation`, `urban_stress`, `industrial_impact`
2. **Median imputation** — handles missing values
3. **StandardScaler** — normalizes all features before model input

Anomaly detector scaler saved separately: `anomaly_scaler.pkl` (the tree-based forecaster needs no scaling)

---

### How Models Work Together

```
CSV Data
   ↓
services/__init__.py  →  get_latest_reading(city, location)
   ↓
feature_engineering.py  →  engineer_features() + prepare_features()
   ↓
risk_classifier.py  →  predict_risk()       → risk level + confidence
anomaly_detector.py →  detect_anomaly()     → is_anomaly + score
   ↓
API routes return combined results to frontend
```

The simulation engine (`simulation.py`) does NOT use ML — it uses hand-crafted impact coefficients (empirically derived) to calculate what-if scenarios. This is intentional for speed and interpretability.

---

## Backend Architecture

**Framework:** FastAPI with uvicorn

**Entry point:** `backend/app/main.py`
- Registers 10 routers under `/api/`
- CORS configured for `http://localhost:3000`
- Lifespan context for startup/shutdown logging

**10 API Route Files:**

| Route prefix | File | Purpose |
|---|---|---|
| `/api/auth` | `auth.py` | Login/register with demo bypass |
| `/api/locations` | `locations.py` | City/location list from CSV |
| `/api/dashboard` | `dashboard.py` | Pillar cards, AI insights, city overview |
| `/api/alerts` | `alerts.py` | Active alerts, history |
| `/api/forecast` | `forecast.py` | 48-hour ARIMA-style predictions |
| `/api/grievance` | `grievance.py` | Submit complaints, look up status by tracking ID |
| `/api/simulation` | `simulation.py` | What-if scenario engine |
| `/api/site-analysis` | `site_analysis.py` | Construction suitability + FSI/TDR |
| `/api/ml` | `ml_predictions.py` | Direct ML model endpoints |

**Data layer (`services/__init__.py`):**
- Loads CSV once with `@lru_cache` — stays in memory
- `get_latest_reading()` — random sample from location rows (simulates live data)
- `generate_alerts()` — threshold-based alert generation
- `generate_forecast()` — ARIMA-inspired 48hr forecast with rush-hour patterns
- `build_pillar_cards()` — formats 7-pillar summary for dashboard

**Auth:** Demo mode — any email starting with "demo" or ending with "@demo.com" bypasses Supabase. JWT tokens issued via `python-jose`.

---

## Frontend Architecture

**Framework:** React 18 + Vite, port 3000

**State management:** Zustand (`useAppStore.js`) — stores `city`, `location`, `user`, `token`

**Routing:** React Router v6, 14 pages

**API calls:** Axios instance in `services/api.js` — auto-attaches JWT, proxied to backend via Vite config

**14 Pages:**

| Page | Route | What it does |
|---|---|---|
| HomePage | `/` | Landing/intro |
| LoginPage | `/login` | Auth form |
| CitySelectPage | `/select-city` | Pick city + location |
| DashboardPage | `/dashboard` | 7 pillar cards + AI insights |
| AlertsPage | `/alerts` | Active alerts list |
| ForecastPage | `/forecast` | 48hr chart per pillar |
| SimulatorPage | `/simulator` | What-if sliders |
| SiteAnalyzerPage | `/site-analyzer` | Construction suitability |
| MapPage | `/map` | Leaflet map of current AQI risk per location |
| GrievancePage | `/grievance` | Submit complaint |
| ProfilePage | `/profile` | User profile |
| SettingsPage | `/settings` | App settings |
| NotFoundPage | `*` | 404 |

**Key frontend env vars (`frontend/.env`):**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=http://localhost:8000
```

---

## Frontend ↔ Backend Connection

```
Browser (localhost:3000)
   ↓  axios call to /api/...
Vite dev server (proxy)
   ↓  forwards to localhost:8000
FastAPI backend
   ↓  reads CSV / runs ML
JSON response
   ↑  back to React component
```

The Vite proxy (`vite.config.js`) forwards all `/api/*` requests to `http://localhost:8000`, so the frontend never needs to hardcode the backend URL in most places. All calls go through the shared Axios client in `services/api.js`.

---

## Database (Supabase)

Schema defined in `scripts/supabase_schema.sql`, extended by `scripts/migrations/001_full_readings.sql`. `backend/scripts/migrate_and_seed.py` applies the migration and uploads the dataset. Tables:
- `cities`, `locations` — seeded with 20 locations (10 Pune, 10 Mumbai)
- `env_readings` — every dataset column for all 10,000 readings; served to the app when `DATA_SOURCE=supabase`
- `alerts`, `forecasts` — generated dynamically, not persisted
- `grievances` — citizen reports with a `tracking_id`, written in database mode and looked up via `/api/grievance/status/{tracking_id}`
- `user_profiles` — extends Supabase auth

Row Level Security enabled. Public read on readings/alerts/forecasts. Own-row-only on grievances and profiles.

---

## The 7 Environmental Pillars

| Pillar | Key Metric | Safe Limit |
|---|---|---|
| Air Quality | AQI (PM2.5-based) | AQI < 100 |
| Water Quality | WQI | WQI > 70 |
| Noise | Day dB(A) | < 65 dB |
| Industrial Emissions | NOx µg/m³ | < 80 µg/m³ |
| Solid Waste | kg/km²/day | < 5000 |
| Urban Heat | UHI intensity °C | < 3°C |
| Groundwater | TDS mg/L | < 500 mg/L |

---

## Site Analyzer — How It Works

The most unique feature. Given a city + location + construction type:

1. Fetches environmental reading for that location
2. Checks each parameter against construction-type-specific thresholds (e.g. hospitals need AQI < 80, schools need AQI < 100)
3. Calculates a 0-100 suitability score
4. If score < 60, finds alternative locations in the same city that score better
5. For factories/parking, predicts pollution impact on surrounding population
6. Returns FSI/TDR/zonal regulations for that location (hardcoded from PMC/MCGM DCR rules)

12 construction types supported: hospital, school, factory, hotel, residential, IT park, old age home, gym, street food, market, sports complex, parking.

---

## Running the Project

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm run dev
```

URLs:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

Login: `demo@demo.com` / any password

---

## Training the ML Models

Models are not pre-trained in the repo (no `.pkl` files committed). To train:

```bash
cd backend
source venv/bin/activate
python scripts/train_all_models.py
```

This trains both the risk classifier and anomaly detector on the CSV dataset and saves `.pkl` files to `backend/app/ml/models/`.

Until models are trained, the ML endpoints (`/api/ml/*`) will return errors. All other features (dashboard, alerts, forecast, simulator, site analyzer) work without trained models since they use the CSV data directly.
