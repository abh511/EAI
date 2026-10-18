from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: Optional[str] = None
    role: str = "citizen"

# ── Location ──────────────────────────────────────────────────────────────────
class LocationOut(BaseModel):
    id: str
    name: str
    zone_type: Optional[str]
    latitude: float
    longitude: float
    is_coastal: bool = False
    city_name: str

# ── Pillar summary card ───────────────────────────────────────────────────────
class PillarCard(BaseModel):
    pillar: str
    label: str
    icon: str
    value: float
    unit: str
    status: str
    trend: str
    description: str

# ── Dashboard summary ─────────────────────────────────────────────────────────
class DashboardSummary(BaseModel):
    city: str
    location: str
    zone_type: str
    aqi: int
    aqi_category: str
    overall_risk: str
    pillars: List[PillarCard]
    active_alerts: int
    last_updated: str

# ── Alert ─────────────────────────────────────────────────────────────────────
class AlertOut(BaseModel):
    id: str
    pillar: str
    severity: str
    parameter: str
    observed_value: float
    threshold_value: float
    message: str
    authority: Optional[str]
    status: str
    location: str
    city: str
    created_at: str

# ── Forecast point ────────────────────────────────────────────────────────────
class ForecastPoint(BaseModel):
    time: str
    value: float
    will_breach: bool
    confidence: float

class ForecastResponse(BaseModel):
    location: str
    city: str
    pillar: str
    parameter: str
    unit: str
    threshold: float
    points: List[ForecastPoint]
    peak_risk_time: Optional[str]
    summary: str

# ── Grievance ─────────────────────────────────────────────────────────────────
class GrievanceSubmit(BaseModel):
    location_name: str
    city: str
    pillar: str
    description: str = Field(min_length=10, max_length=500)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class GrievanceOut(BaseModel):
    id: str
    status: str
    message: str
    tracking_id: str