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
    """Test user registration endpoint (demo path, so no real Supabase sign-up)"""
    payload = {
        "email": "tester@demo.com",
        "password": "test123",
        "full_name": "Test User"
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_demo_bypass_requires_demo_domain(client: AsyncClient):
    """Emails that merely start with "demo" must not skip authentication"""
    from unittest.mock import patch
    with patch("app.api.routes.auth.get_supabase_client", side_effect=Exception("offline")):
        response = await client.post("/api/auth/login", json={"email": "demon@gmail.com", "password": "x"})
    assert response.status_code == 401

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

@pytest.mark.asyncio
async def test_grievance_status_needs_database(client: AsyncClient):
    """Without a database nothing is stored, so tracking must not invent a status"""
    response = await client.get("/api/grievance/status/GRV-2026-ABC123")
    assert response.status_code == 501
