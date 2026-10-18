# EnviroWatch AI — How The Project Works (File by File)

---

## The Big Picture

```
User Browser (React, port 3000)
        ↓  HTTP request to /api/...
Vite Dev Server (proxy)
        ↓  forwards to port 8000
FastAPI Backend
        ↓  reads CSV / runs ML
JSON response
        ↑  back to React component → renders on screen
```

There are three layers: **Frontend (React)**, **Backend (FastAPI)**, and **Data (CSV + Supabase)**.
They never talk directly to each other except through HTTP API calls.

---

## STEP 1 — App Starts

### `frontend/src/main.jsx`
The entry point. Mounts the React app into `index.html`. Nothing special here.

### `frontend/src/App.jsx`
Defines all the routes (14 pages). Every page is lazy-loaded so the browser only downloads
what it needs. Also sets up a `ProtectedRoute` wrapper — if there's no JWT token in
`localStorage`, the user gets redirected to `/login`.

### `frontend/src/store/useAppStore.js`
Global state store (Zustand). Holds three things:
- `city` — which city the user selected (e.g. "Mumbai")
- `location` — which location within that city (e.g. "Bandra West")
- `user` — logged-in user object + JWT token

These are also persisted to `localStorage` so they survive page refresh.
Every page reads from this store to know which city/location to fetch data for.

---

## STEP 2 — Login

### `frontend/src/pages/LoginPage.jsx`
User types email + password → calls `authAPI.login()`.

### `frontend/src/services/api.js`
All API calls live here. It creates an Axios instance pointing to `http://localhost:8000`.
It has two interceptors:
1. **Request interceptor** — automatically attaches `Authorization: Bearer <token>` to every request
2. **Response interceptor** — catches errors and extracts the error message

The login call hits `POST /api/auth/login`.

### `backend/app/api/routes/auth.py`
Receives the login request. If the email starts with "demo" or ends with "@demo.com",
it bypasses Supabase entirely and issues a JWT token directly (demo mode).
Otherwise it checks Supabase auth. Returns a JWT token on success.

### Back in `LoginPage.jsx`
Token is saved to `localStorage` via `useAppStore.setUser()`. User is redirected to
`/select-city`.

---

## STEP 3 — City & Location Selection

### `frontend/src/pages/CitySelectPage.jsx`
Calls `locationsAPI.list()` → hits `GET /api/locations/list`.

### `backend/app/api/routes/locations.py`
Calls `get_all_cities()` from the services layer.

### `backend/app/services/__init__.py`
This is the **data layer** — the most important backend file.

`load_data()` reads the CSV file once using `@lru_cache` — meaning it loads into memory
on the first call and stays there. Every subsequent call returns the same in-memory DataFrame.

```
backend/data/pune_mumbai_environmental_data_17022026.csv
  → 10,000 rows × 70 columns
  → loaded once into RAM as a pandas DataFrame
  → all backend functions read from this DataFrame
```

`get_all_cities()` scans the DataFrame for unique city + location combinations and returns them.

User picks a city and location → saved to `useAppStore` → redirected to `/dashboard`.

---

## STEP 4 — Dashboard Loads

### `frontend/src/pages/DashboardPage.jsx`
Reads `city` and `location` from `useAppStore`. Makes multiple API calls in parallel:
- `dashboardAPI.getPillars(city, location)` → 7 pillar cards
- `dashboardAPI.getAIInsights(city, location)` → AI text summary
- `dashboardAPI.getSummary(city, location)` → overall risk level

### `backend/app/api/routes/dashboard.py`
Receives the requests and calls the services layer.

### `backend/app/services/__init__.py` (again)

`get_latest_reading(city, location)`:
- Filters the DataFrame to rows matching the city + location
- Does `df.sample(1)` — picks ONE random row
- Returns it as a dict

This is how "live data" is simulated. Every time you refresh, you get a different
random row from the historical data for that location.

`build_pillar_cards(reading)`:
- Takes the raw reading dict
- Extracts the 7 key metrics (AQI, WQI, noise dB, NOx, waste kg, temp, groundwater TDS)
- Compares each against its safe threshold
- Returns status: "good" / "moderate" / "unhealthy" / "critical"
- Also adds a random trend direction (up/down/stable)

---

## STEP 5 — ML Predictions (Risk + Anomaly)

### `frontend/src/pages/DashboardPage.jsx`
Also calls the ML endpoint to get risk classification.

### `backend/app/api/routes/ml_predictions.py`
Receives the request with the raw environmental reading.

### `backend/app/ml/feature_engineering.py`
For the risk forecaster, `forecast_features(reading, history)` builds 12 inputs: the
current reading, the average AQI over the previous hour (from `history`) and the time of day.

For the anomaly detector, `prepare_features()` creates 6 derived features, then normalizes
them with the scaler saved during training (`anomaly_scaler.pkl`).

### `backend/app/ml/risk_classifier.py`

`predict_risk(reading, history)`:
- Loads `models/risk_classifier.pkl` (Random Forest + XGBoost ensemble)
- Predicts the average risk class for the **next 3 hours**
- Computes the current risk directly from the AQI formula (no model needed)
- If the air is hazardous now, forces the forecast to Critical (`safety_override`)

### `backend/app/ml/anomaly_detector.py`

`detect_anomaly(features)`:
- Rule checks first: physically impossible values, or values far outside the training range
- Then Isolation Forest (`models/anomaly_detector.pkl`) on 30 features
- Returns `is_anomaly`, a raw anomaly score (more negative = more unusual), and `reasons`

### How models were trained (one-time process)

```
backend/scripts/train_all_models.py
  → loads the full CSV via services.load_data()
  → risk_classifier.train_risk_classifier()
      builds 3-hour-ahead targets, evaluates on the latest 25% of the day,
      then refits on all data → saves risk_classifier.pkl + metrics JSON
  → anomaly_detector.train_anomaly_detector()
      → saves anomaly_detector.pkl, anomaly_scaler.pkl, anomaly_bounds.json
```

After training, the `.pkl` files sit in `backend/app/ml/models/` and are loaded
on every prediction request. No retraining happens at runtime.

---

## STEP 6 — Alerts

### `frontend/src/pages/AlertsPage.jsx`
Calls `alertsAPI.getActive(city, location)`.

### `backend/app/api/routes/alerts.py`
Calls `generate_alerts(city, location)` from services.

### `backend/app/services/__init__.py`

`generate_alerts(city, location)`:
- Gets a random reading via `get_latest_reading()`
- Loops through 14 tracked parameters (PM2.5, NO2, noise, water BOD, etc.)
- For each parameter, calculates `ratio = observed_value / safe_limit`
- If ratio >= 1.0, an alert is created
- Severity is determined by how far above the limit: 1.0x = low, 1.5x = medium, 2.0x = high, 2.5x+ = critical
- Alerts are sorted critical → high → medium → low

---

## STEP 7 — Forecast

### `frontend/src/pages/ForecastPage.jsx`
Calls `forecastAPI.get48hr(city, location, pillar)` for each of the 7 pillars.

### `backend/app/api/routes/forecast.py`
Calls `generate_forecast(city, location, pillar)`.

### `backend/app/services/__init__.py`

`generate_forecast()`:
- Pulls ALL historical rows for that city + location from the DataFrame
- Calculates mean, std, min, max from real data
- Checks if recent values (last 20%) are trending up or down
- Generates 49 hourly data points (0 to 48 hours ahead) using:
  - Rush hour multiplier (+15% at 7–9am, 5–8pm)
  - Weekend multiplier (-10% on Sat/Sun)
  - Trend drift (slowly moves toward the detected trend)
  - Autocorrelation (each value is 70% correlated to the previous one)
  - Random noise (normal distribution, std = 30% of historical std)
  - Occasional spikes (10% chance per hour, +10% to +30%)
- Confidence score starts at 95% and drops 0.8% per hour

This is NOT a trained ML model. It's a statistical simulator built from real data patterns.

---

## STEP 8 — Site Analyzer

### `frontend/src/pages/SiteAnalyzerPage.jsx`
User picks city, location, and construction type → calls `POST /api/site-analysis/analyze`.

### `backend/app/api/routes/site_analysis.py`
- Gets the latest environmental reading for that location
- Checks each parameter against construction-type-specific thresholds
  (e.g. hospitals need AQI < 80, factories can tolerate AQI < 200)
- Calculates a 0–100 suitability score
- If score < 60, scans all other locations in the same city to find better alternatives
- Returns FSI/TDR/zoning regulations (hardcoded from PMC/MCGM DCR rules)

---

## STEP 9 — Simulation (What-If)

### `frontend/src/pages/SimulatorPage.jsx`
User adjusts sliders (add a factory, increase traffic, etc.) → calls `POST /api/simulation/run`.

### `backend/app/api/routes/simulation.py`
Does NOT use ML models. Uses hardcoded impact coefficients:
- "Add factory within 1km" → NOx +35%, SOx +28%, PM2.5 +22%
- "Double traffic density" → AQI +18%, noise +12%
- etc.

Applies these multipliers to the current reading and returns the projected values.
Intentionally rule-based for speed and interpretability.

---

## STEP 10 — Grievance

### `frontend/src/pages/GrievancePage.jsx`
User fills a form + optional image upload → calls `POST /api/grievance/submit`.

### `backend/app/api/routes/grievance.py`
This is the ONE feature that actually writes to Supabase (the real database).
All other features read from the CSV. Grievances are stored permanently in the
`grievances` table in Supabase with Row Level Security — users can only see their own.

---

## Full File → Function Map

```
User action
  → frontend/src/pages/*.jsx          (UI, triggers API call)
  → frontend/src/services/api.js      (Axios, attaches JWT, sends HTTP)
  → frontend/vite.config.js           (proxy: /api → localhost:8000 in dev)
  → backend/app/main.py               (FastAPI app, registers all routers)
  → backend/app/api/routes/*.py       (route handler, validates request)
  → backend/app/services/__init__.py  (data layer: reads CSV, generates output)
  → backend/app/ml/*.py               (ML models: feature engineering + prediction)
  → backend/data/*.csv                (raw data source, loaded once into RAM)
  → backend/app/ml/models/*.pkl       (trained model files, loaded on demand)
  → Supabase                          (only for auth + grievances)
  ← JSON response
  → frontend/src/store/useAppStore.js (global state update if needed)
  → React component re-renders with new data
```

---

## Key Design Decisions

- **CSV over live DB** — all environmental data is served from a pandas DataFrame in RAM.
  Fast, no DB latency, but not real-time. `get_latest_reading()` uses `df.sample(1)` to
  simulate live sensor readings.

- **`@lru_cache` on `load_data()`** — the 10,000-row CSV is loaded exactly once when the
  first request comes in. Every subsequent request reuses the same in-memory DataFrame.

- **Supabase only for user data** — auth, user profiles, and grievances go to Supabase.
  Everything else (readings, alerts, forecasts, ML) is computed on the fly from the CSV.

- **Vite proxy** — in development, the frontend runs on port 3000 and the backend on 8000.
  `vite.config.js` proxies all `/api/*` requests to `localhost:8000` so the frontend
  never needs to hardcode the backend URL.

- **JWT in localStorage** — the token is stored in `localStorage` and attached to every
  request by the Axios interceptor in `api.js`. The backend validates it on protected routes.
