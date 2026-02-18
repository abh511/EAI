# Test All Endpoints - EnviroWatch AI

Use these curl commands to test all backend endpoints are working.

## Prerequisites
Backend must be running: `uvicorn app.main:app --reload`

---

## 1. Health Check
```bash
curl http://localhost:8000/api/health
```
Expected: `{"status":"healthy","service":"EnviroWatch AI"}`

---

## 2. Locations

### List All Cities
```bash
curl http://localhost:8000/api/locations/list
```
Expected: JSON with `cities` object containing Pune and Mumbai

### Get Pune Locations
```bash
curl http://localhost:8000/api/locations/Pune
```
Expected: JSON with `locations` array

### Get Mumbai Locations
```bash
curl http://localhost:8000/api/locations/Mumbai
```
Expected: JSON with `locations` array

---

## 3. Dashboard

### Get Summary
```bash
curl "http://localhost:8000/api/dashboard/summary?city=Pune&location=Viman%20Nagar"
```
Expected: JSON with `aqi`, `pillars`, `overall_risk`

### Get Pillars
```bash
curl "http://localhost:8000/api/dashboard/pillars?city=Pune&location=Hadapsar"
```
Expected: JSON with `pillars` array (7 items)

### Get City Overview
```bash
curl "http://localhost:8000/api/dashboard/city-overview?city=Pune"
```
Expected: JSON with `locations` array and `avg_aqi`

---

## 4. Alerts

### Get Active Alerts
```bash
curl "http://localhost:8000/api/alerts/active?city=Pune&location=Hadapsar"
```
Expected: JSON with `alerts` array

### Get Alert History
```bash
curl "http://localhost:8000/api/alerts/history?city=Pune&days=7"
```
Expected: JSON with `alerts` array (may be empty)

### Acknowledge Alert
```bash
curl -X POST http://localhost:8000/api/alerts/ALT-PM2_5-1234/acknowledge
```
Expected: `{"message":"Alert acknowledged","alert_id":"ALT-PM2_5-1234"}`

---

## 5. Forecast

### Get 48hr Forecast (Air)
```bash
curl "http://localhost:8000/api/forecast/48hr/Viman%20Nagar?city=Pune&pillar=air"
```
Expected: JSON with `points` array (49 items)

### Get 48hr Forecast (Water)
```bash
curl "http://localhost:8000/api/forecast/48hr/Hadapsar?city=Pune&pillar=water"
```
Expected: JSON with `points` array (49 items)

---

## 6. Grievance

### Submit Grievance
```bash
curl -X POST http://localhost:8000/api/grievance/submit \
  -H "Content-Type: application/json" \
  -d '{
    "location_name": "Viman Nagar",
    "city": "Pune",
    "pillar": "air",
    "description": "High pollution levels observed near main road causing health issues for residents"
  }'
```
Expected: JSON with `tracking_id` like `GRV-2026-ABC123`

### Get Grievance Status
```bash
curl http://localhost:8000/api/grievance/status/GRV-2026-ABC123
```
Expected: JSON with `status`, `submitted_at`, `updated_at`

---

## 7. Authentication

### Register User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "full_name": "Test User"
  }'
```
Expected: JSON with `access_token`, `user_id`, `email`
Note: May fail if Supabase not configured or user exists

### Login User
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```
Expected: JSON with `access_token`, `user_id`, `email`

### Logout
```bash
curl -X POST http://localhost:8000/api/auth/logout
```
Expected: `{"message":"Logged out successfully"}`

---

## Quick Test Script

Save this as `test_api.sh` and run with `bash test_api.sh`:

```bash
#!/bin/bash

echo "Testing EnviroWatch AI API..."
echo ""

echo "1. Health Check"
curl -s http://localhost:8000/api/health | jq
echo ""

echo "2. List Cities"
curl -s http://localhost:8000/api/locations/list | jq '.cities | keys'
echo ""

echo "3. Get Pune Locations"
curl -s http://localhost:8000/api/locations/Pune | jq '.locations | length'
echo ""

echo "4. Get Dashboard Summary"
curl -s "http://localhost:8000/api/dashboard/summary?city=Pune&location=Viman%20Nagar" | jq '{aqi, overall_risk, pillar_count: (.pillars | length)}'
echo ""

echo "5. Get Active Alerts"
curl -s "http://localhost:8000/api/alerts/active?city=Pune&location=Hadapsar" | jq '.alerts | length'
echo ""

echo "6. Get 48hr Forecast"
curl -s "http://localhost:8000/api/forecast/48hr/Viman%20Nagar?city=Pune&pillar=air" | jq '{location, pillar, point_count: (.points | length)}'
echo ""

echo "7. Submit Grievance"
curl -s -X POST http://localhost:8000/api/grievance/submit \
  -H "Content-Type: application/json" \
  -d '{"location_name":"Viman Nagar","city":"Pune","pillar":"air","description":"Test grievance for API testing purposes"}' | jq '{tracking_id, status}'
echo ""

echo "All tests complete!"
```

---

## Expected Results Summary

All endpoints should return:
- ✅ Status 200 (or 201 for POST)
- ✅ Valid JSON response
- ✅ No error messages
- ✅ Data matches expected structure

If any endpoint fails:
1. Check backend is running
2. Check dataset CSV exists
3. Check backend logs for errors
4. Verify URL encoding for spaces (%20)

---

## Frontend Testing

Once backend is confirmed working, test frontend:

1. Start frontend: `npm run dev`
2. Open http://localhost:3000
3. Register/Login
4. Select Pune → Viman Nagar
5. Verify dashboard loads
6. Test all navigation links
7. Check browser console for errors

---

## Common Issues

### Issue: "No data found"
**Solution:** Ensure dataset CSV is at `backend/data/pune_mumbai_environmental_data_17022026.csv`

### Issue: "Failed to fetch"
**Solution:** Check CORS settings and backend is running on port 8000

### Issue: "Authentication failed"
**Solution:** Verify Supabase credentials in `.env` file

### Issue: Empty response
**Solution:** Check backend logs for errors, verify data exists for that location

---

**Last Updated:** February 17, 2026
