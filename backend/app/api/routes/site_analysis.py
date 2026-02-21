"""
Site Suitability Analyzer for Urban Planning
Analyzes environmental conditions for construction site selection
"""
from fastapi import APIRouter, Query, HTTPException, status
from typing import List, Dict
from datetime import datetime
import numpy as np

from app.services import get_location_data, load_data
from loguru import logger

router = APIRouter()

# Construction type requirements
CONSTRUCTION_REQUIREMENTS = {
    "hospital": {
        "name": "Hospital / Medical Facility",
        "aqi_max": 80, "noise_day_max": 55, "water_quality_min": 75,
        "industrial_proximity_min": 5.0, "traffic_density_max": 40, "green_cover_min": 25,
        "critical_factors": ["air", "noise", "water"],
        "icon": "🏥",
        "rationale": "Patients are vulnerable populations. Poor air quality, excessive noise, or contaminated water can severely worsen health outcomes and delay recovery."
    },
    "school": {
        "name": "School / Educational Institution",
        "aqi_max": 100, "noise_day_max": 65, "water_quality_min": 70,
        "industrial_proximity_min": 3.0, "traffic_density_max": 50, "green_cover_min": 30,
        "critical_factors": ["air", "noise"],
        "icon": "🏫",
        "rationale": "Children's lungs and brains are still developing. Pollution exposure at schools affects cognitive performance and causes long-term health damage."
    },
    "factory": {
        "name": "Factory / Industrial Unit",
        "aqi_max": 200, "noise_day_max": 75, "residential_proximity_min": 2.0,
        "critical_factors": ["impact_on_others"],
        "icon": "🏭",
        "impact_prediction": {
            "nox_increase_pct": 40, "pm10_increase_pct": 30, "sox_increase_pct": 35,
            "noise_increase_dba": 15, "affected_radius_km": 3.0,
        },
        "rationale": "Industrial activity will emit pollutants. Site must be far enough from residential/sensitive areas to minimize harm to population."
    },
    "hotel": {
        "name": "Hotel / Commercial Complex",
        "aqi_max": 120, "noise_day_max": 70, "water_quality_min": 60,
        "uhi_intensity_max": 4.0, "traffic_density_max": 80,
        "critical_factors": ["air", "aesthetics"],
        "icon": "🏨",
        "rationale": "Hotels attract tourists and business travelers. Poor air quality, extreme heat, or unpleasant environment will harm reputation and bookings."
    },
    "residential": {
        "name": "Residential Complex",
        "aqi_max": 100, "noise_day_max": 60, "noise_night_max": 50,
        "water_quality_min": 70, "industrial_proximity_min": 2.5, "green_cover_min": 20,
        "critical_factors": ["air", "water", "noise"],
        "icon": "🏠",
        "rationale": "Residents live here full-time. Long-term exposure to pollution causes chronic diseases. Families with children and elderly need safe environment."
    },
    "it_park": {
        "name": "IT Park / Office Complex",
        "aqi_max": 110, "noise_day_max": 70, "water_quality_min": 65,
        "traffic_density_max": 85,
        "critical_factors": ["air"],
        "icon": "💻",
        "rationale": "Office workers spend 8-10 hours daily indoors/outdoors. Poor air quality reduces productivity, increases sick leave, and harms talent retention."
    },
    "old_age_home": {
        "name": "Old Age Home / Senior Living",
        "aqi_max": 75, "noise_day_max": 55, "noise_night_max": 45,
        "water_quality_min": 80, "industrial_proximity_min": 5.0,
        "traffic_density_max": 35, "green_cover_min": 35,
        "critical_factors": ["air", "noise", "water", "heat"],
        "icon": "🏡",
        "rationale": "Elderly have weakened immunity and pre-existing conditions. Extreme vulnerability to air pollution, heat stress, and noise-induced sleep disturbance."
    },
    "gym": {
        "name": "Gym / Fitness Center",
        "aqi_max": 90, "noise_day_max": 70, "water_quality_min": 65,
        "traffic_density_max": 75, "green_cover_min": 15,
        "critical_factors": ["air"],
        "icon": "💪",
        "rationale": "People exercise with heavy breathing, inhaling 10-15x more air. Poor air quality during workouts causes respiratory damage and reduces performance."
    },
    "street_food": {
        "name": "Street Food Zone / Food Court",
        "aqi_max": 110, "noise_day_max": 75, "water_quality_min": 70,
        "traffic_density_max": 90, "waste_gen_max": 5000,
        "critical_factors": ["water", "waste"],
        "icon": "🍛",
        "rationale": "Food preparation requires clean water. High foot traffic generates waste. Poor sanitation causes foodborne illnesses. Popular in Pune/Mumbai street culture."
    },
    "temple": {
        "name": "Temple / Religious Place",
        "aqi_max": 95, "noise_day_max": 75, "water_quality_min": 75,
        "traffic_density_max": 85, "green_cover_min": 25,
        "critical_factors": ["air", "water", "aesthetics"],
        "icon": "🛕",
        "rationale": "Devotees visit for peace and spiritual well-being. Clean environment is essential. Water used for rituals must be pure. Important in Maharashtra culture."
    },
    "market": {
        "name": "Market / Shopping Complex",
        "aqi_max": 115, "noise_day_max": 75, "water_quality_min": 60,
        "traffic_density_max": 95, "waste_gen_max": 6000,
        "critical_factors": ["traffic", "waste"],
        "icon": "🏪",
        "rationale": "High footfall generates traffic congestion and waste. Requires good accessibility. Vendors and customers spend hours daily in the area."
    },
    "sports_complex": {
        "name": "Sports Complex / Stadium",
        "aqi_max": 85, "noise_day_max": 80, "water_quality_min": 65,
        "traffic_density_max": 70, "green_cover_min": 30, "uhi_intensity_max": 3.5,
        "critical_factors": ["air", "heat"],
        "icon": "⚽",
        "rationale": "Athletes perform intense physical activity outdoors. Poor air quality reduces performance and causes health issues. Heat stress is a major concern."
    },
    "parking": {
        "name": "Multi-Level Parking / Parking Lot",
        "aqi_max": 150, "noise_day_max": 75, "residential_proximity_min": 0.5,
        "traffic_density_max": 100,
        "critical_factors": ["impact_on_others"],
        "icon": "🅿️",
        "impact_prediction": {
            "nox_increase_pct": 25, "pm10_increase_pct": 20, "co_increase_pct": 30,
            "noise_increase_dba": 10, "affected_radius_km": 0.5,
        },
        "rationale": "Vehicle emissions concentrate in parking areas. Must be away from residential zones. Essential for reducing street parking congestion in Pune/Mumbai."
    },
}

@router.get("/analyze")
async def analyze_site(
    city: str = Query(...),
    location: str = Query(...),
    construction_type: str = Query(..., regex="^(hospital|school|factory|hotel|residential|it_park|old_age_home|gym|street_food|temple|market|sports_complex|parking)$"),
):
    """
    Analyze site suitability for construction
    
    Returns:
    - suitability_score: 0-100 (100 = perfect site)
    - risk_factors: List of violations
    - recommendations: Better alternative locations
    - impact_prediction: What will happen after construction
    - should_build: boolean decision
    """
    try:
        # Get requirements for this construction type
        requirements = CONSTRUCTION_REQUIREMENTS[construction_type]
        
        # Get current environmental data
        df = get_location_data(city, location)
        if df.empty:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"No data for {location}, {city}")
        
        reading = df.sample(1).iloc[0].to_dict()
        
        # Calculate suitability score
        score, violations, checks = calculate_suitability(reading, requirements)
        
        # Find better alternatives if score < 60
        alternatives = []
        if score < 60:
            alternatives = find_better_locations(city, construction_type, location)
        
        # Predict impact if this is a factory or parking
        impact = None
        if construction_type in ["factory", "parking"]:
            impact = predict_construction_impact(reading, requirements, construction_type)
        
        # Generate recommendations
        recommendations = generate_recommendations(
            score, violations, construction_type, location, reading
        )
        
        # Risk assessment
        risk_level = "low" if score >= 75 else "medium" if score >= 50 else "high" if score >= 30 else "critical"
        should_build = score >= 60  # Minimum threshold
        
        return {
            "construction_type": requirements["name"],
            "icon": requirements["icon"],
            "location": location,
            "city": city,
            "suitability_score": round(score, 1),
            "risk_level": risk_level,
            "should_build": should_build,
            "decision_summary": generate_decision_summary(should_build, score, construction_type, location, violations),
            "environmental_checks": checks,
            "violations": violations,
            "recommendations": recommendations,
            "alternative_locations": alternatives,
            "predicted_impact": impact,
            "rationale": requirements["rationale"],
            "analyzed_at": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Site analysis error: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Analysis failed")

def calculate_suitability(reading: dict, requirements: dict) -> tuple:
    """
    Calculate suitability score (0-100) based on requirements
    Returns: (score, violations_list, checks_dict)
    """
    checks = {}
    violations = []
    total_score = 0
    max_possible = 0
    
    # Air Quality Check
    if "aqi_max" in requirements:
        aqi = reading.get("aqi_us", 150)
        req = requirements["aqi_max"]
        if aqi <= req:
            checks["air_quality"] = {"status": "pass", "value": aqi, "limit": req, "message": f"AQI {aqi} ✓"}
            total_score += 20
        else:
            excess = round((aqi - req) / req * 100)
            checks["air_quality"] = {"status": "fail", "value": aqi, "limit": req, "message": f"AQI {aqi} (EXCEEDS by {excess}%)"}
            violations.append({
                "factor": "Air Quality",
                "severity": "high" if aqi > req * 1.5 else "medium",
                "message": f"AQI is {aqi}, {excess}% above acceptable limit of {req}",
                "impact": "Respiratory health risk for occupants"
            })
        max_possible += 20
    
    # Noise Check
    if "noise_day_max" in requirements:
        noise = reading.get("noise_day_dba", 65)
        req = requirements["noise_day_max"]
        if noise <= req:
            checks["noise_level"] = {"status": "pass", "value": noise, "limit": req, "message": f"Noise {noise} dB(A) ✓"}
            total_score += 15
        else:
            excess = round(noise - req, 1)
            checks["noise_level"] = {"status": "fail", "value": noise, "limit": req, "message": f"Noise {noise} dB(A) (EXCEEDS by {excess} dB)"}
            violations.append({
                "factor": "Noise Pollution",
                "severity": "high" if noise > req + 10 else "medium",
                "message": f"Noise level is {noise} dB(A), {excess} dB above limit of {req} dB(A)",
                "impact": "Sleep disturbance, stress, reduced concentration"
            })
        max_possible += 15
    
    # Water Quality Check
    if "water_quality_min" in requirements:
        wqi = reading.get("water_quality_index", 50)
        req = requirements["water_quality_min"]
        if wqi >= req:
            checks["water_quality"] = {"status": "pass", "value": wqi, "limit": req, "message": f"WQI {wqi} ✓"}
            total_score += 15
        else:
            deficit = round((req - wqi) / req * 100)
            checks["water_quality"] = {"status": "fail", "value": wqi, "limit": req, "message": f"WQI {wqi} (BELOW required {req})"}
            violations.append({
                "factor": "Water Quality",
                "severity": "critical" if wqi < req * 0.7 else "high",
                "message": f"Water quality index is {wqi}, {deficit}% below required standard of {req}",
                "impact": "Contaminated water causes waterborne diseases, unsafe for consumption"
            })
        max_possible += 15
    
    # Industrial Proximity Check
    if "industrial_proximity_min" in requirements:
        dist = reading.get("industrial_proximity_km", 10)
        req = requirements["industrial_proximity_min"]
        if dist >= req:
            checks["industrial_distance"] = {"status": "pass", "value": dist, "limit": req, "message": f"{dist}km from industry ✓"}
            total_score += 15
        else:
            checks["industrial_distance"] = {"status": "fail", "value": dist, "limit": req, "message": f"{dist}km (TOO CLOSE - need {req}km)"}
            violations.append({
                "factor": "Industrial Proximity",
                "severity": "high",
                "message": f"Only {dist}km from industrial zone. Required minimum: {req}km",
                "impact": "Constant exposure to industrial emissions (NOx, SOx, particulates)"
            })
        max_possible += 15
    
    # Traffic Density Check
    if "traffic_density_max" in requirements:
        traffic = reading.get("traffic_density", 50)
        req = requirements["traffic_density_max"]
        if traffic <= req:
            checks["traffic"] = {"status": "pass", "value": traffic, "limit": req, "message": f"Traffic {traffic}/100 ✓"}
            total_score += 10
        else:
            excess = round((traffic - req) / req * 100)
            checks["traffic"] = {"status": "fail", "value": traffic, "limit": req, "message": f"Traffic {traffic}/100 (EXCEEDS by {excess}%)"}
            violations.append({
                "factor": "Traffic Congestion",
                "severity": "medium",
                "message": f"Traffic density {traffic}/100, {excess}% above acceptable {req}/100",
                "impact": "Vehicle emissions increase air pollution, noise, and access difficulty"
            })
        max_possible += 10
    
    # Green Cover Check
    if "green_cover_min" in requirements:
        green = reading.get("green_cover_pct", 10)
        req = requirements["green_cover_min"]
        if green >= req:
            checks["green_cover"] = {"status": "pass", "value": green, "limit": req, "message": f"Green cover {green}% ✓"}
            total_score += 10
        else:
            deficit = round((req - green) / req * 100)
            checks["green_cover"] = {"status": "fail", "value": green, "limit": req, "message": f"Green cover {green}% (BELOW {req}%)"}
            violations.append({
                "factor": "Insufficient Green Space",
                "severity": "medium",
                "message": f"Only {green}% green cover, {deficit}% below required {req}%",
                "impact": "Lack of trees increases heat, reduces air purification, poor aesthetics"
            })
        max_possible += 10
    
    # UHI Check
    if "uhi_intensity_max" in requirements:
        uhi = reading.get("uhi_intensity", 2)
        req = requirements["uhi_intensity_max"]
        if uhi <= req:
            checks["heat_island"] = {"status": "pass", "value": uhi, "limit": req, "message": f"UHI {uhi}°C ✓"}
            total_score += 10
        else:
            excess = round(uhi - req, 1)
            checks["heat_island"] = {"status": "fail", "value": uhi, "limit": req, "message": f"UHI {uhi}°C (EXCEEDS by {excess}°C)"}
            violations.append({
                "factor": "Urban Heat Island",
                "severity": "medium",
                "message": f"UHI intensity is {uhi}°C, {excess}°C above comfortable limit of {req}°C",
                "impact": "Extreme heat causes discomfort, health risks for elderly, higher cooling costs"
            })
        max_possible += 10
    
    # Waste Generation Check (for food/market areas)
    if "waste_gen_max" in requirements:
        waste = reading.get("waste_gen_kg_sqkm_day", 3000)
        req = requirements["waste_gen_max"]
        if waste <= req:
            checks["waste_management"] = {"status": "pass", "value": waste, "limit": req, "message": f"Waste {int(waste)} kg/km²/day ✓"}
            total_score += 10
        else:
            excess = round((waste - req) / req * 100)
            checks["waste_management"] = {"status": "fail", "value": waste, "limit": req, "message": f"Waste {int(waste)} kg/km²/day (EXCEEDS by {excess}%)"}
            violations.append({
                "factor": "High Waste Generation",
                "severity": "medium",
                "message": f"Area generates {int(waste)} kg/km²/day waste, {excess}% above manageable limit of {int(req)} kg/km²/day",
                "impact": "Waste accumulation attracts pests, causes odor, sanitation issues, and health hazards"
            })
        max_possible += 10
    
    # Calculate percentage score
    final_score = (total_score / max_possible * 100) if max_possible > 0 else 0
    
    return final_score, violations, checks

def find_better_locations(city: str, construction_type: str, exclude: str) -> list:
    """Find alternative locations with better suitability scores"""
    df = load_data()
    df_city = df[df["city"] == city]
    
    alternatives = []
    requirements = CONSTRUCTION_REQUIREMENTS[construction_type]
    
    for location in df_city["location"].unique():
        if location == exclude:
            continue
        loc_data = df_city[df_city["location"] == location].sample(1).iloc[0].to_dict()
        score, _, _ = calculate_suitability(loc_data, requirements)
        
        if score >= 70:  # Only suggest good alternatives
            alternatives.append({
                "location": location,
                "suitability_score": round(score, 1),
                "distance_from_original": "N/A",
                "key_advantage": get_key_advantage(loc_data, requirements)
            })
    
    # Sort by score and return top 3
    alternatives.sort(key=lambda x: x["suitability_score"], reverse=True)
    return alternatives[:3]

def get_key_advantage(reading: dict, requirements: dict) -> str:
    """Identify the strongest advantage of this location"""
    aqi = reading.get("aqi_us", 150)
    if "aqi_max" in requirements and aqi < requirements["aqi_max"] * 0.7:
        return f"Excellent air quality (AQI {int(aqi)})"
    
    wqi = reading.get("water_quality_index", 50)
    if "water_quality_min" in requirements and wqi > requirements["water_quality_min"] * 1.2:
        return f"Superior water quality (WQI {int(wqi)})"
    
    green = reading.get("green_cover_pct", 10)
    if "green_cover_min" in requirements and green > requirements["green_cover_min"] * 1.5:
        return f"High green cover ({int(green)}%)"
    
    return "Better overall environmental conditions"

def predict_construction_impact(reading: dict, requirements: dict, construction_type: str) -> dict:
    """Predict environmental impact of building a factory or parking"""
    impact_config = requirements.get("impact_prediction", {})
    
    baseline_nox = reading.get("nox_ug_m3", 50)
    baseline_pm10 = reading.get("pm10_ug_m3", 80)
    baseline_noise = reading.get("noise_day_dba", 60)
    
    predicted_nox = baseline_nox * (1 + impact_config.get("nox_increase_pct", 0) / 100)
    predicted_pm10 = baseline_pm10 * (1 + impact_config.get("pm10_increase_pct", 0) / 100)
    predicted_noise = baseline_noise + impact_config.get("noise_increase_dba", 0)
    
    affected_radius = impact_config.get("affected_radius_km", 3.0)
    
    # Rough population estimate
    population_density_per_km2 = 8000
    affected_area_km2 = 3.14159 * (affected_radius ** 2)
    affected_population = int(population_density_per_km2 * affected_area_km2)
    
    # Construction-specific mitigations
    if construction_type == "factory":
        mitigations = [
            "Install high-efficiency pollution control equipment (electrostatic precipitators, scrubbers)",
            "Implement strict emission monitoring with real-time sensors",
            "Create 500m green buffer zone with dense tree plantation",
            "Restrict operating hours to daytime only (6 AM - 10 PM)",
            "Mandate quarterly air quality audits by MPCB",
        ]
        health_impact = f"Estimated {int(affected_population * 0.15)} residents (15%) may experience respiratory symptoms"
    else:  # parking
        mitigations = [
            "Install electric vehicle charging stations to encourage EV adoption",
            "Plant trees around perimeter to absorb vehicle emissions",
            "Implement proper ventilation systems in covered parking",
            "Use permeable paving to reduce runoff and heat island effect",
            "Install air quality sensors and display real-time pollution levels",
        ]
        health_impact = f"Estimated {int(affected_population * 0.08)} residents (8%) may experience increased respiratory irritation"
    
    return {
        "construction_impact": {
            "nox": {"before": round(baseline_nox, 1), "after": round(predicted_nox, 1), "change_pct": impact_config.get("nox_increase_pct", 0)},
            "pm10": {"before": round(baseline_pm10, 1), "after": round(predicted_pm10, 1), "change_pct": impact_config.get("pm10_increase_pct", 0)},
            "noise": {"before": round(baseline_noise, 1), "after": round(predicted_noise, 1), "change_dba": impact_config.get("noise_increase_dba", 0)},
        },
        "affected_radius_km": affected_radius,
        "estimated_affected_population": affected_population,
        "health_impact": health_impact,
        "mitigation_required": mitigations,
    }

def generate_recommendations(score: float, violations: list, construction_type: str, location: str, reading: dict) -> list:
    """Generate actionable recommendations"""
    recommendations = []
    
    if score >= 75:
        recommendations.append({
            "type": "approval",
            "message": f"Site is suitable for {construction_type}. Proceed with construction after obtaining necessary clearances."
        })
    elif score >= 60:
        recommendations.append({
            "type": "conditional",
            "message": f"Site is marginally suitable. Proceed with caution and implement mitigation measures."
        })
        # Add specific mitigations
        for v in violations:
            if v["factor"] == "Air Quality":
                recommendations.append({
                    "type": "mitigation",
                    "message": "Install HVAC systems with HEPA filters and air purifiers in all rooms"
                })
            elif v["factor"] == "Noise Pollution":
                recommendations.append({
                    "type": "mitigation",
                    "message": "Install noise barriers / acoustic walls around perimeter"
                })
    else:
        recommendations.append({
            "type": "rejection",
            "message": f"Site is NOT suitable for {construction_type}. High environmental risks detected."
        })
        recommendations.append({
            "type": "alternative",
            "message": f"Consider alternative locations with better environmental conditions (see suggestions below)"
        })
    
    return recommendations

def generate_decision_summary(should_build: bool, score: float, construction_type: str, location: str, violations: list) -> str:
    """Generate human-readable decision summary"""
    if should_build:
        if score >= 75:
            return f"✅ APPROVED: {location} is suitable for {CONSTRUCTION_REQUIREMENTS[construction_type]['name']}. Environmental conditions meet all safety standards."
        else:
            return f"⚠️ CONDITIONAL APPROVAL: {location} is marginally suitable. Score: {score}/100. {len(violations)} environmental concern(s) identified. Mitigation measures required."
    else:
        severity_count = sum(1 for v in violations if v["severity"] in ["critical", "high"])
        return f"❌ NOT RECOMMENDED: {location} is unsuitable for {CONSTRUCTION_REQUIREMENTS[construction_type]['name']}. Score: {score}/100. {severity_count} critical violation(s) detected. High health/safety risk."

@router.get("/construction-types")
async def get_construction_types():
    """Return list of available construction types with requirements"""
    return {
        "types": [
            {"id": k, "name": v["name"], "icon": v["icon"], "rationale": v["rationale"]}
            for k, v in CONSTRUCTION_REQUIREMENTS.items()
        ]
    }

@router.get("/ping")
async def ping():
    return {"router": "site_analysis", "status": "online"}
