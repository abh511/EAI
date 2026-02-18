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
      "time": "2026-02-17 14:00",
      "value": 156.2,
      "will_breach": true,
      "confidence": 0.92
    }
  ],
  "peak_risk_time": "2026-02-18 09:00",
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
Submit a citizen grievance.

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
  "tracking_id": "GRV-2026-001234"
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
Get grievance status by tracking ID.

**Path Parameters:**
- `tracking_id` (string): Tracking ID

**Response (200):**
```json
{
  "tracking_id": "GRV-2026-001234",
  "status": "under_review",
  "submitted_at": "2026-02-17T14:30:00",
  "updated_at": "2026-02-17T15:00:00"
}
```

**Example:**
```bash
curl http://localhost:8000/api/grievance/status/GRV-2026-001234
```

---

## Health Check

### GET /api/health
Check API health status.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-17T14:30:00"
}
```

**Example:**
```bash
curl http://localhost:8000/api/health
```
