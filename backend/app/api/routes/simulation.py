"""
What-If Simulation Engine
Allows testing of scenarios: "What if traffic increases 20%?"
"""
from fastapi import APIRouter, Query, HTTPException, status
from app.services import get_latest_reading
from datetime import datetime
from loguru import logger

router = APIRouter()

@router.post("/predict-impact")
async def simulate_scenario(
    city: str = Query(...),
    location: str = Query(...),
    traffic_change_pct: float = Query(0, ge=-50, le=100),
    industrial_change_pct: float = Query(0, ge=-50, le=100),
    wind_speed_change_pct: float = Query(0, ge=-50, le=100),
    rainfall_change_pct: float = Query(0, ge=-100, le=200),
    temperature_change_pct: float = Query(0, ge=-20, le=30),
    green_cover_change_pct: float = Query(0, ge=-50, le=100),
):
    """
    Simulate environmental impact of parameter changes
    Returns predicted new values for all pillars
    """
    try:
        baseline = get_latest_reading(city, location)
        if not baseline:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"No data for {location}, {city}")
        
        # Impact coefficients (empirically derived)
        # Positive coefficient = increases pollution
        # Negative coefficient = decreases pollution
        COEFFICIENTS = {
            "pm2_5_ug_m3": {
                "traffic": 0.4, 
                "industrial": 0.3, 
                "wind": -0.25,
                "rainfall": -0.35,      # Rain washes out particulates
                "temperature": 0.15,    # Higher temp increases photochemical reactions
                "green_cover": -0.20,   # Trees filter air
            },
            "pm10_ug_m3": {
                "traffic": 0.5, 
                "industrial": 0.35, 
                "wind": -0.3,
                "rainfall": -0.40,      # Rain is very effective for larger particles
                "temperature": 0.10,
                "green_cover": -0.18,
            },
            "no2_ug_m3": {
                "traffic": 0.6, 
                "industrial": 0.4, 
                "wind": -0.2,
                "rainfall": -0.15,      # Less effective for gases
                "temperature": 0.25,    # Higher temp increases NOx formation
                "green_cover": -0.12,
            },
            "nox_ug_m3": {
                "traffic": 0.3, 
                "industrial": 0.7, 
                "wind": -0.15,
                "rainfall": -0.10,
                "temperature": 0.30,    # Temperature strongly affects NOx
                "green_cover": -0.10,
            },
            "sox_ug_m3": {
                "traffic": 0.1, 
                "industrial": 0.8, 
                "wind": -0.1,
                "rainfall": -0.25,      # Rain dissolves SO2
                "temperature": 0.08,
                "green_cover": -0.08,
            },
        }
        
        simulated = {}
        impacts = {}
        
        for param, coefs in COEFFICIENTS.items():
            base_val = float(baseline.get(param, 0))
            
            # Calculate impact from each factor
            traffic_impact = base_val * (traffic_change_pct / 100) * coefs["traffic"]
            industrial_impact = base_val * (industrial_change_pct / 100) * coefs["industrial"]
            wind_impact = base_val * (wind_speed_change_pct / 100) * coefs["wind"]
            rainfall_impact = base_val * (rainfall_change_pct / 100) * coefs["rainfall"]
            temperature_impact = base_val * (temperature_change_pct / 100) * coefs["temperature"]
            green_cover_impact = base_val * (green_cover_change_pct / 100) * coefs["green_cover"]
            
            # Sum all impacts
            total_impact = (traffic_impact + industrial_impact + wind_impact + 
                          rainfall_impact + temperature_impact + green_cover_impact)
            
            new_val = max(0, base_val + total_impact)
            simulated[param] = round(new_val, 2)
            impacts[param] = {
                "baseline": round(base_val, 2),
                "predicted": round(new_val, 2),
                "change_pct": round(((new_val - base_val) / base_val * 100) if base_val > 0 else 0, 1),
            }
        
        # Recalculate AQI
        new_aqi = pm25_to_aqi(simulated["pm2_5_ug_m3"])
        baseline_aqi = int(baseline.get("aqi_us", 150))
        
        return {
            "scenario": {
                "traffic_change": f"{traffic_change_pct:+}%",
                "industrial_change": f"{industrial_change_pct:+}%",
                "wind_speed_change": f"{wind_speed_change_pct:+}%",
                "rainfall_change": f"{rainfall_change_pct:+}%",
                "temperature_change": f"{temperature_change_pct:+}%",
                "green_cover_change": f"{green_cover_change_pct:+}%",
            },
            "results": impacts,
            "aqi": {
                "baseline": baseline_aqi,
                "predicted": new_aqi,
                "change": new_aqi - baseline_aqi,
                "category": aqi_category(new_aqi),
            },
            "summary": generate_summary(
                baseline_aqi, new_aqi, 
                traffic_change_pct, industrial_change_pct,
                rainfall_change_pct, green_cover_change_pct
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Simulation failed")

def generate_summary(baseline_aqi, new_aqi, traffic_pct, industrial_pct, rainfall_pct, green_cover_pct):
    if new_aqi < baseline_aqi:
        improvement = baseline_aqi - new_aqi
        factors = []
        if rainfall_pct > 0:
            factors.append("increased rainfall")
        if green_cover_pct > 0:
            factors.append("more green cover")
        if traffic_pct < 0:
            factors.append("reduced traffic")
        if industrial_pct < 0:
            factors.append("reduced industrial activity")
        
        factor_text = ", ".join(factors) if factors else "these changes"
        return f"✅ Scenario predicts {improvement} point AQI improvement due to {factor_text}. Air quality would improve from {aqi_category(baseline_aqi)} to {aqi_category(new_aqi)}."
    elif new_aqi > baseline_aqi:
        deterioration = new_aqi - baseline_aqi
        return f"⚠️ Scenario predicts {deterioration} point AQI deterioration. Immediate mitigation needed."
    return "Minimal impact predicted from these changes."

def pm25_to_aqi(pm25):
    """Convert PM2.5 to AQI using EPA breakpoints"""
    breakpoints = [
        (0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ]
    for lo_c, hi_c, lo_a, hi_a in breakpoints:
        if lo_c <= pm25 <= hi_c:
            return int(((hi_a - lo_a) / (hi_c - lo_c)) * (pm25 - lo_c) + lo_a)
    return 500

def aqi_category(aqi):
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Moderate"
    if aqi <= 150: return "Unhealthy for Sensitive Groups"
    if aqi <= 200: return "Unhealthy"
    if aqi <= 300: return "Very Unhealthy"
    return "Hazardous"

@router.get("/ping")
async def ping():
    return {"router": "simulation", "status": "online"}
