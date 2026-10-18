# EnviroWatch AI — API Documentation

Base URL: `http://localhost:8000`

---

## Authentication

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "uuid-string",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "citizen"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","full_name":"Test User"}'
```

---

### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "uuid-string",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "citizen"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

### POST /api/auth/logout
Logout current user.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/auth/logout
```

---

## Locations

### GET /api/locations/list
Get list of all cities with their locations.

**Response (200):**
```json
{
  "cities": {
    "Pune": [
      {
        "location": "Viman Nagar",
        "latitude": 18.5679,
        "longitude": 73.9143,
        "zone_type": "Mixed"
      }
    ],
    "Mumbai": [...]
  }
}
```

**Example:**
```bash
curl http://localhost:8000/api/locations/list
```

---

### GET /api/locations/{city}
Get all locations for a specific city.

**Path Parameters:**
- `city` (string): City name (e.g., "Pune", "Mumbai")

**Response (200):**
```json
{
  "city": "Pune",
  "locations": [
    {
      "id": "pune-viman-nagar",
      "name": "Viman Nagar",
      "zone_type": "Mixed",
      "latitude": 18.5679,
      "longitude": 73.9143,
      "is_coastal": false,
      "city_name": "Pune"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8000/api/locations/Pune
```

---

## Dashboard

### GET /api/dashboard/summary
Get comprehensive dashboard summary for a location.

**Query Parameters:**
- `city` (string, required): City name
- `location` (string, required): Location name

**Response (200):**
```json
{
  "city": "Pune",
  "location": "Viman Nagar",
  "zone_type": "Mixed",
  "aqi": 156,
  "aqi_category": "Unhealthy",
  "overall_risk": "medium",
  "pillars": [
    {
      "pillar": "air",
      "label": "Air Quality",
      "icon": "Wind",
      "value": 156,
      "unit": "AQI",
      "status": "unhealthy",
      "trend": "up",
      "description": "PM2.5: 87.3 µg/m³"
    }
  ],
  "active_alerts": 3,
  "last_updated": "2026-02-17T14:30:00"
}
```

**Example:**
```bash
curl "http://localhost:8000/api/dashboard/summary?city=Pune&location=Viman%20Nagar"
```

---

### GET /api/dashboard/pillars
Get detailed pillar cards for a location.

**Query Parameters:**
- `city` (string, required): City name
- `location` (string, required): Location name

**Response (200):**
```json
{
  "pillars": [
    {
      "pillar": "air",
      "label": "Air Quality",
      "icon": "Wind",
      "value": 156,
      "unit": "AQI",
      "status": "unhealthy",
      "trend": "up",
      "description": "PM2.5: 87.3 µg/m³"
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:8000/api/dashboard/pillars?city=Pune&location=Hadapsar"
```

---

### GET /api/dashboard/city-overview
Get city-wide overview with all locations.

**Query Parameters:**
- `city` (string, required): City name

**Response (200):**
```json
{
  "city": "Pune",
  "total_locations": 10,
  "avg_aqi": 142,
  "locations": [
    {
      "name": "Viman Nagar",
      "aqi": 156,
      "risk": "medium",
      "latitude": 18.5679,
      "longitude": 73.9143
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:8000/api/dashboard/city-overview?city=Mumbai"
```

---

## Alerts

### GET /api/alerts/active
Get active alerts for a location.

**Query Parameters:**
- `city` (string, required): City name
- `location` (string, required): Location name

**Response (200):**
```json
{
  "alerts": [
    {
      "id": "ALT-PM2_5-1234",
      "pillar": "air",
      "severity": "high",
      "parameter": "PM2.5",
      "observed_value": 87.3,
      "threshold_value": 60,
      "message": "PM2.5 at Viman Nagar is 87.3 µg/m³ (46% above safe limit)",
      "authority": "CPCB / MPCB",
      "status": "open",
      "location": "Viman Nagar",
      "city": "Pune",
      "created_at": "2026-02-17T14:30:00"
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:8000/api/alerts/active?city=Pune&location=Hadapsar"
```

---

### GET /api/alerts/history
Get alert history for a location.

**Query Parameters:**
- `city` (string, required): City name
- `location` (string, required): Location name
- `days` (integer, optional): Number of days to look back (default: 7)

**Response (200):**
```json
{
  "alerts": [...]
}
```

**Example:**
```bash
curl "http://localhost:8000/api/alerts/history?city=Pune&location=Hadapsar&days=30"
```

---

### POST /api/alerts/{alert_id}/acknowledge
Acknowledge an alert.

**Path Parameters:**
- `alert_id` (string): Alert ID

**Response (200):**
```json
{
  "message": "Alert acknowledged",
  "alert_id": "ALT-PM2_5-1234"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/alerts/ALT-PM2_5-1234/acknowledge
```

---

## Forecast

### GET /api/forecast/48hr/{location}
Get 48-hour forecast for a location and pillar.

**Path Parameters:**
- `location` (string): Location name

**Query Parameters:**
- `city` (string, required): City name
- `pillar` (string, optional): Pillar name (default: "air")

**Response (200):**
```json
{
  "location": "Viman Nagar",
  "city": "Pune",
  "pillar": "air",
  "parameter": "AQI",
  "unit": "AQI",
  "threshold": 150,
  "points": [
    {
      "time": "2026-02-17T14:00",
      "value": 156.2,
      "will_breach": true,
      "confidence": 0.92
    }
  ],
  "peak_risk_time": "2026-02-18T09:00",
  "summary": "⚠️ AQI is predicted to breach the 150 AQI limit for 18 hours in the next 48 hours."
}
```

**Example:**
```bash
curl "http://localhost:8000/api/forecast/48hr/Viman%20Nagar?city=Pune&pillar=air"
```

---

## Grievance

### POST /api/grievance/submit
Submit a citizen grievance. With `DATA_SOURCE=supabase` it is stored in the `grievances` table; otherwise it is only logged (`"stored": false`). `description` must be 10–500 characters.

**Request Body:**
```json
{
  "location_name": "Viman Nagar",
  "city": "Pune",
  "pillar": "air",
  "description": "High pollution levels observed near main road causing health issues",
  "latitude": 18.5679,
  "longitude": 73.9143
}
```

**Response (201):**
```json
{
  "id": "uuid-string",
  "status": "submitted",
  "message": "Grievance submitted successfully",
  "tracking_id": "GRV-2026-A1B2C3",
  "stored": true
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/grievance/submit \
  -H "Content-Type: application/json" \
  -d '{"location_name":"Viman Nagar","city":"Pune","pillar":"air","description":"High pollution near main road"}'
```

---

### GET /api/grievance/status/{tracking_id}
Get grievance status by tracking ID. Requires `DATA_SOURCE=supabase` (returns 501 otherwise); 404 if the ID is unknown.

**Path Parameters:**
- `tracking_id` (string): Tracking ID

**Response (200):**
```json
{
  "tracking_id": "GRV-2026-A1B2C3",
  "status": "submitted",
  "pillar": "air",
  "submitted_at": "2026-02-17T14:30:00+00:00"
}
```

**Example:**
```bash
curl http://localhost:8000/api/grievance/status/GRV-2026-A1B2C3
```

---

## Machine Learning

### GET /api/ml/predict-risk
Forecast the average risk level over the next 3 hours for a location (Random Forest + XGBoost ensemble). Also returns the current risk from the AQI formula. If current AQI is above 300 the forecast is forced to Critical (`safety_override`). Returns 503 if the models are not trained.

**Query Parameters:** `city`, `location` (required)

**Response (200):**
```json
{
  "risk_level": "Medium",
  "risk_score": 1,
  "confidence": 0.94,
  "probabilities": {"Low": 0.0, "Medium": 0.94, "High": 0.06, "Critical": 0.0},
  "model": "Random Forest + XGBoost Ensemble",
  "n_features_used": 12,
  "horizon_hours": 3,
  "current_aqi": 206,
  "current_risk_level": "High",
  "safety_override": false
}
```

### GET /api/ml/detect-anomaly
Check whether the current reading is anomalous: physical-limit and range rules, then an Isolation Forest.

**Response (200):**
```json
{
  "is_anomaly": false,
  "anomaly_score": -0.41,
  "confidence": 0.41,
  "message": "✅ Reading within normal patterns.",
  "reasons": [],
  "detected_by": []
}
```

### GET /api/ml/model-info
Training metrics: held-out accuracy, balanced accuracy and macro F1 versus a "last hour" baseline, and top features.

---

## Simulation

### POST /api/simulation/predict-impact
What-if scenario. All query parameters are percentages from -50 to 100: `traffic_change_pct`, `industrial_change_pct`, `wind_speed_change_pct`, `rainfall_change_pct`, `festival_activity_pct`, `green_cover_change_pct`, plus required `city` and `location`. Returns baseline vs predicted values for all 7 pillars and the new AQI.

```bash
curl -X POST "http://localhost:8000/api/simulation/predict-impact?city=Pune&location=Baner&traffic_change_pct=20"
```

---

## Site Analysis

### GET /api/site-analysis/construction-types
List the 12 building types with their rationale.

### GET /api/site-analysis/analyze
Suitability (0–100) of a location for a building type. Each check earns full credit within its limit and partial credit just beyond it; 60 or more passes. Factories and parking in residential zones are capped below the pass mark.

**Query Parameters:** `city`, `location`, `construction_type` (one of `hospital`, `school`, `factory`, `hotel`, `residential`, `it_park`, `old_age_home`, `gym`, `street_food`, `market`, `sports_complex`, `parking`)

Returns `suitability_score`, `should_build`, `environmental_checks`, `violations`, `recommendations`, `alternative_locations`, `predicted_impact` (factory/parking) and `buildable_area_analysis` (FSI/TDR).

---

## Health Check

### GET /api/health
Check API health status.

**Response (200):**
```json
{
  "status": "healthy",
  "service": "EnviroWatch AI"
}
```

**Example:**
```bash
curl http://localhost:8000/api/health
```
