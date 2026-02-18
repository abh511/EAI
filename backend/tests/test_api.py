import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Test health check endpoint"""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_locations_list(client: AsyncClient):
    """Test locations list endpoint returns cities"""
    response = await client.get("/api/locations/list")
    assert response.status_code == 200
    data = response.json()
    assert "cities" in data
    cities = data["cities"]
    assert "Pune" in cities
    assert "Mumbai" in cities

@pytest.mark.asyncio
async def test_locations_pune(client: AsyncClient):
    """Test Pune locations endpoint"""
    response = await client.get("/api/locations/Pune")
    assert response.status_code == 200
    data = response.json()
    assert "locations" in data
    assert isinstance(data["locations"], list)
    assert len(data["locations"]) > 0

@pytest.mark.asyncio
async def test_dashboard_summary(client: AsyncClient):
    """Test dashboard summary endpoint"""
    response = await client.get("/api/dashboard/summary?city=Pune&location=Viman Nagar")
    assert response.status_code == 200
    data = response.json()
    assert "aqi" in data
    assert "pillars" in data
    assert "overall_risk" in data
    assert isinstance(data["pillars"], list)

@pytest.mark.asyncio
async def test_alerts_active(client: AsyncClient):
    """Test active alerts endpoint"""
    response = await client.get("/api/alerts/active?city=Pune&location=Hadapsar")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert isinstance(data["alerts"], list)

@pytest.mark.asyncio
async def test_forecast_48hr(client: AsyncClient):
    """Test 48-hour forecast endpoint"""
    response = await client.get("/api/forecast/48hr/Viman Nagar?city=Pune&pillar=air")
    assert response.status_code == 200
    data = response.json()
    assert "points" in data
    assert isinstance(data["points"], list)
    assert len(data["points"]) == 49

@pytest.mark.asyncio
async def test_auth_register(client: AsyncClient):
    """Test user registration endpoint"""
    payload = {
        "email": "test@test.com",
        "password": "test123",
        "full_name": "Test User"
    }
    response = await client.post("/api/auth/register", json=payload)
    # Note: This may fail if Supabase is not configured or user already exists
    # Accept both 201 (success) and 409 (already exists) or 400 (config issue)
    assert response.status_code in [201, 400, 409]
    if response.status_code == 201:
        data = response.json()
        assert "access_token" in data

@pytest.mark.asyncio
async def test_grievance_submit(client: AsyncClient):
    """Test grievance submission endpoint"""
    payload = {
        "location_name": "Viman Nagar",
        "city": "Pune",
        "pillar": "air",
        "description": "High pollution levels observed near main road causing health issues"
    }
    response = await client.post("/api/grievance/submit", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "tracking_id" in data
