"""
Site Suitability Analyzer for Urban Planning
Analyzes environmental conditions for construction site selection
"""
from fastapi import APIRouter, Query, HTTPException, status
from typing import List, Dict
from datetime import datetime
import numpy as np
import pandas as pd

from app.services import get_location_data, load_data
from loguru import logger

router = APIRouter()

# FSI/TDR/Zonal Regulations Database (Pune & Mumbai)
# Based on Development Control Regulations (DCR) 2034 for Mumbai and Pune Municipal Corporation rules
ZONAL_REGULATIONS = {
    "Pune": {
        "Hadapsar": {
            "zone_type": "Residential-Commercial Mixed",
            "fsi_base": 1.5,
            "fsi_with_tdr": 2.0,
            "fsi_premium": 2.5,
            "max_floors": 15,
            "ground_coverage": 50,  # percentage
            "setback_front_m": 3.0,
            "setback_side_m": 1.5,
            "parking_required": "1 space per 100 sqm",
            "height_limit_m": 45,
            "tdr_available": True,
            "tdr_rate_per_sqm": 8500,
            "premium_fsi_cost_per_sqm": 12000,
            "regulations": "PMC DCR 2017 - Zone R2 (Residential with commercial on ground floor allowed)"
        },
        "Kothrud": {
            "zone_type": "Residential",
            "fsi_base": 1.2,
            "fsi_with_tdr": 1.8,
            "fsi_premium": 2.2,
            "max_floors": 12,
            "ground_coverage": 45,
            "setback_front_m": 3.0,
            "setback_side_m": 2.0,
            "parking_required": "1 space per 80 sqm",
            "height_limit_m": 36,
            "tdr_available": True,
            "tdr_rate_per_sqm": 9000,
            "premium_fsi_cost_per_sqm": 13000,
            "regulations": "PMC DCR 2017 - Zone R1 (Purely residential, no commercial activity)"
        },
        "Hinjewadi": {
            "zone_type": "IT/Commercial",
            "fsi_base": 2.0,
            "fsi_with_tdr": 2.5,
            "fsi_premium": 3.0,
            "max_floors": 20,
            "ground_coverage": 40,
            "setback_front_m": 6.0,
            "setback_side_m": 3.0,
            "parking_required": "1 space per 50 sqm",
            "height_limit_m": 60,
            "tdr_available": True,
            "tdr_rate_per_sqm": 7000,
            "premium_fsi_cost_per_sqm": 10000,
            "regulations": "MIDC Special Economic Zone - IT Park regulations, 24x7 operations allowed"
        },
        "Shivajinagar": {
            "zone_type": "Commercial",
            "fsi_base": 1.8,
            "fsi_with_tdr": 2.3,
            "fsi_premium": 2.8,
            "max_floors": 18,
            "ground_coverage": 50,
            "setback_front_m": 4.0,
            "setback_side_m": 2.0,
            "parking_required": "1 space per 60 sqm",
            "height_limit_m": 54,
            "tdr_available": True,
            "tdr_rate_per_sqm": 11000,
            "premium_fsi_cost_per_sqm": 15000,
            "regulations": "PMC DCR 2017 - Zone C1 (Commercial core, high-density allowed)"
        },
        "Pimpri": {
            "zone_type": "Industrial-Residential",
            "fsi_base": 1.0,
            "fsi_with_tdr": 1.5,
            "fsi_premium": 1.8,
            "max_floors": 10,
            "ground_coverage": 55,
            "setback_front_m": 5.0,
            "setback_side_m": 3.0,
            "parking_required": "1 space per 120 sqm",
            "height_limit_m": 30,
            "tdr_available": False,
            "tdr_rate_per_sqm": 0,
            "premium_fsi_cost_per_sqm": 8000,
            "regulations": "PCMC Industrial Zone - Restrictions on residential construction near factories"
        },
    },
    "Mumbai": {
        "Andheri": {
            "zone_type": "Residential-Commercial Mixed",
            "fsi_base": 1.33,
            "fsi_with_tdr": 2.0,
            "fsi_premium": 2.5,
            "max_floors": 20,
            "ground_coverage": 33,
            "setback_front_m": 3.0,
            "setback_side_m": 1.5,
            "parking_required": "1 space per 65 sqm",
            "height_limit_m": 60,
            "tdr_available": True,
            "tdr_rate_per_sqm": 25000,
            "premium_fsi_cost_per_sqm": 35000,
            "regulations": "MCGM DCR 2034 - Suburban Zone, Metro corridor benefits applicable"
        },
        "Bandra": {
            "zone_type": "Residential Premium",
            "fsi_base": 1.33,
            "fsi_with_tdr": 2.0,
            "fsi_premium": 2.5,
            "max_floors": 25,
            "ground_coverage": 33,
            "setback_front_m": 4.0,
            "setback_side_m": 2.0,
            "parking_required": "1 space per 50 sqm",
            "height_limit_m": 75,
            "tdr_available": True,
            "tdr_rate_per_sqm": 35000,
            "premium_fsi_cost_per_sqm": 50000,
            "regulations": "MCGM DCR 2034 - Premium residential zone, heritage restrictions in some pockets"
        },
        "Worli": {
            "zone_type": "Commercial-Residential",
            "fsi_base": 1.33,
            "fsi_with_tdr": 2.5,
            "fsi_premium": 3.0,
            "max_floors": 30,
            "ground_coverage": 33,
            "setback_front_m": 5.0,
            "setback_side_m": 3.0,
            "parking_required": "1 space per 45 sqm",
            "height_limit_m": 90,
            "tdr_available": True,
            "tdr_rate_per_sqm": 45000,
            "premium_fsi_cost_per_sqm": 60000,
            "regulations": "MCGM DCR 2034 - Island City premium zone, CRZ regulations apply near coast"
        },
        "Thane": {
            "zone_type": "Residential",
            "fsi_base": 1.2,
            "fsi_with_tdr": 1.8,
            "fsi_premium": 2.2,
            "max_floors": 18,
            "ground_coverage": 40,
            "setback_front_m": 3.0,
            "setback_side_m": 1.5,
            "parking_required": "1 space per 70 sqm",
            "height_limit_m": 54,
            "tdr_available": True,
            "tdr_rate_per_sqm": 18000,
            "premium_fsi_cost_per_sqm": 25000,
            "regulations": "TMC Development Plan 2024 - Extended suburbs, metro connectivity benefits"
        },
        "Navi Mumbai": {
            "zone_type": "Planned Township",
            "fsi_base": 1.0,
            "fsi_with_tdr": 1.5,
            "fsi_premium": 2.0,
            "max_floors": 15,
            "ground_coverage": 35,
            "setback_front_m": 4.0,
            "setback_side_m": 2.0,
            "parking_required": "1 space per 75 sqm",
            "height_limit_m": 45,
            "tdr_available": True,
            "tdr_rate_per_sqm": 15000,
            "premium_fsi_cost_per_sqm": 20000,
            "regulations": "CIDCO Regulations - Planned development, strict adherence to master plan required"
        },
    }
}

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
        "traffic_density_max": 35, "green_cover_min": 35, "uhi_intensity_max": 3.0,
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
    construction_type: str = Query(..., pattern="^(hospital|school|factory|hotel|residential|it_park|old_age_home|gym|street_food|market|sports_complex|parking)$"),
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
        
        # Calculate FSI/TDR/Zonal regulations
        buildable_info = calculate_buildable_area(city, location, plot_area_sqm=1000)
        
        return {
            "construction_type": requirements["name"],
            "icon": requirements["icon"],
            "location": location,
            "city": city,
            "suitability_score": round(score, 1),
            "risk_level": risk_level,
            "should_build": should_build,
            "decision_summary": generate_decision_summary(should_build, round(score, 1), construction_type, location, violations),
            "environmental_checks": checks,
            "violations": violations,
            "recommendations": recommendations,
            "alternative_locations": alternatives,
            "predicted_impact": impact,
            "rationale": requirements["rationale"],
            "buildable_area_analysis": buildable_info,
            "analyzed_at": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Site analysis error: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Analysis failed")

# One row per check:
# (requirement key, check id, reading column, default, weight, direction, tolerance, tolerance type, factor, unit, impact)
# Inside the limit a check earns its full weight. Past it, credit falls linearly to
# zero at `tolerance` beyond the limit (a fraction of the limit, or absolute units),
# so AQI 105 against a limit of 100 scores far better than AQI 300.
SUITABILITY_CHECKS = [
    ("aqi_max", "air_quality", "aqi_us", 150, 20, "max", 0.5, "rel", "Air Quality", "AQI",
     "Respiratory health risk for occupants"),
    ("noise_day_max", "noise_level", "noise_day_dba", 65, 15, "max", 10, "abs", "Noise Pollution", "dB(A)",
     "Stress, reduced concentration, communication difficulty"),
    ("noise_night_max", "night_noise", "noise_night_dba", 50, 10, "max", 10, "abs", "Night-time Noise", "dB(A)",
     "Sleep disturbance, raised blood pressure"),
    ("water_quality_min", "water_quality", "water_quality_index", 50, 15, "min", 0.3, "rel", "Water Quality", "WQI",
     "Contaminated water causes waterborne diseases, unsafe for consumption"),
    ("industrial_proximity_min", "industrial_distance", "industrial_proximity_km", 10, 15, "min", 0.5, "rel",
     "Industrial Proximity", "km", "Constant exposure to industrial emissions (NOx, SOx, particulates)"),
    ("traffic_density_max", "traffic", "traffic_density", 50, 10, "max", 0.5, "rel", "Traffic Congestion", "/100",
     "Vehicle emissions increase air pollution, noise, and access difficulty"),
    ("green_cover_min", "green_cover", "green_cover_pct", 10, 10, "min", 0.5, "rel", "Insufficient Green Space", "%",
     "Lack of trees increases heat, reduces air purification"),
    ("uhi_intensity_max", "heat_island", "uhi_intensity", 2, 10, "max", 0.5, "rel", "Urban Heat Island", "°C",
     "Extreme heat causes discomfort, health risks for elderly, higher cooling costs"),
    ("waste_gen_max", "waste_management", "waste_gen_kg_sqkm_day", 3000, 10, "max", 0.5, "rel",
     "High Waste Generation", "kg/km²/day", "Waste accumulation attracts pests, causes odor and sanitation issues"),
]

# The dataset has no distance-to-homes column, so a location's zone type stands in for it
RESIDENTIAL_ZONE_KEYWORDS = ("Residential", "Slum", "High-Density", "Township")
RESIDENTIAL_BLOCK_CAP = 40  # below the pass mark of 60


def _check_credit(value: float, limit: float, direction: str, tolerance: float, tol_type: str) -> float:
    gap = value - limit if direction == "max" else limit - value
    if gap <= 0:
        return 1.0
    span = tolerance if tol_type == "abs" else limit * tolerance
    return max(0.0, 1 - gap / span)


def calculate_suitability(reading: dict, requirements: dict) -> tuple:
    """
    Calculate suitability score (0-100) based on requirements
    Returns: (score, violations_list, checks_dict)
    """
    checks = {}
    violations = []
    total_score = 0.0
    max_possible = 0

    for key, check_id, col, default, weight, direction, tol, tol_type, factor, unit, impact in SUITABILITY_CHECKS:
        if key not in requirements:
            continue
        value = reading.get(col, default)
        value = default if value is None or pd.isna(value) else float(value)
        limit = requirements[key]
        credit = _check_credit(value, limit, direction, tol, tol_type)
        total_score += weight * credit
        max_possible += weight

        shown = int(value) if unit == "kg/km²/day" else round(value, 2 if unit == "km" else 1)
        if credit == 1.0:
            checks[check_id] = {"status": "pass", "value": shown, "limit": limit, "credit": 1.0,
                                "message": f"{factor.replace('Insufficient ', '').replace('High ', '')}: {shown} {unit} ✓"}
            continue

        word = "above the maximum" if direction == "max" else "below the minimum"
        checks[check_id] = {"status": "fail", "value": shown, "limit": limit, "credit": round(credit, 2),
                            "message": f"{shown} {unit} ({word} of {limit} {unit}; {round(credit * 100)}% credit)"}
        if credit > 0:
            severity = "medium"
        else:
            severity = "critical" if check_id == "water_quality" else "high"
        violations.append({
            "factor": factor,
            "severity": severity,
            "message": f"{factor}: {shown} {unit}, {word} of {limit} {unit}",
            "impact": impact,
        })

    residential = False
    if "residential_proximity_min" in requirements:
        zone = str(reading.get("zone_type", ""))
        residential = any(k in zone for k in RESIDENTIAL_ZONE_KEYWORDS)
        max_possible += 15
        if not residential:
            total_score += 15
            checks["residential_zone"] = {"status": "pass", "value": zone, "limit": "non-residential zone",
                                          "credit": 1.0, "message": f"{zone} zone ✓"}
        else:
            checks["residential_zone"] = {"status": "fail", "value": zone, "limit": "non-residential zone",
                                          "credit": 0.0, "message": f"{zone} zone (residents nearby)"}
            violations.append({
                "factor": "Residential Proximity",
                "severity": "high",
                "message": f"Location is a {zone} zone; required at least "
                           f"{requirements['residential_proximity_min']} km from homes",
                "impact": "Emissions and noise directly affect nearby residents",
            })

    final_score = (total_score / max_possible * 100) if max_possible > 0 else 0
    if residential:
        # Next to homes is a blocker for polluting builds, whatever the other scores
        final_score = min(final_score, RESIDENTIAL_BLOCK_CAP)
    return final_score, violations, checks

def find_better_locations(city: str, construction_type: str, exclude: str) -> list:
    """Find alternative locations with better suitability scores"""
    df = load_data()
    df_city = df[df["city"].str.lower() == city.lower()]
    
    alternatives = []
    requirements = CONSTRUCTION_REQUIREMENTS[construction_type]
    
    for location in df_city["location"].unique():
        if location.lower() == exclude.lower():
            continue
        loc_data = df_city[df_city["location"] == location].sample(1).iloc[0].to_dict()
        score, _, _ = calculate_suitability(loc_data, requirements)
        
        if score >= 60:  # Only suggest alternatives better than failing threshold
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

def calculate_buildable_area(city: str, location: str, plot_area_sqm: float = 1000) -> dict:
    """
    Calculate buildable area based on FSI/TDR regulations
    Default plot size: 1000 sqm (typical commercial plot)
    """
    # Get zonal regulations
    zonal_data = ZONAL_REGULATIONS.get(city, {}).get(location, None)
    
    if not zonal_data:
        # Default values if location not in database
        zonal_data = {
            "zone_type": "General Residential",
            "fsi_base": 1.0,
            "fsi_with_tdr": 1.5,
            "fsi_premium": 2.0,
            "max_floors": 10,
            "ground_coverage": 40,
            "setback_front_m": 3.0,
            "setback_side_m": 1.5,
            "parking_required": "1 space per 100 sqm",
            "height_limit_m": 30,
            "tdr_available": False,
            "tdr_rate_per_sqm": 0,
            "premium_fsi_cost_per_sqm": 10000,
            "regulations": "Standard municipal regulations apply"
        }
    
    # Calculate buildable areas
    base_buildable = plot_area_sqm * zonal_data["fsi_base"]
    tdr_buildable = plot_area_sqm * zonal_data["fsi_with_tdr"] if zonal_data["tdr_available"] else base_buildable
    premium_buildable = plot_area_sqm * zonal_data["fsi_premium"]
    
    # Calculate costs
    tdr_additional_area = tdr_buildable - base_buildable
    tdr_total_cost = tdr_additional_area * zonal_data["tdr_rate_per_sqm"] if zonal_data["tdr_available"] else 0
    
    premium_additional_area = premium_buildable - base_buildable
    premium_total_cost = premium_additional_area * zonal_data["premium_fsi_cost_per_sqm"]
    
    # Calculate ground floor area (based on ground coverage)
    ground_floor_area = plot_area_sqm * (zonal_data["ground_coverage"] / 100)
    
    # Calculate typical floor area (after setbacks)
    # Assuming square plot for simplicity
    plot_side = plot_area_sqm ** 0.5
    usable_side = plot_side - (zonal_data["setback_front_m"] + zonal_data["setback_side_m"])
    typical_floor_area = usable_side ** 2
    
    # Calculate number of floors possible
    max_floors_by_fsi = int(base_buildable / typical_floor_area)
    actual_max_floors = min(max_floors_by_fsi, zonal_data["max_floors"])
    
    return {
        "plot_area_sqm": plot_area_sqm,
        "zone_type": zonal_data["zone_type"],
        "fsi_regulations": {
            "base_fsi": zonal_data["fsi_base"],
            "base_buildable_area_sqm": round(base_buildable, 2),
            "base_buildable_area_sqft": round(base_buildable * 10.764, 2),
        },
        "tdr_option": {
            "available": zonal_data["tdr_available"],
            "fsi_with_tdr": zonal_data["fsi_with_tdr"],
            "buildable_area_sqm": round(tdr_buildable, 2) if zonal_data["tdr_available"] else 0,
            "buildable_area_sqft": round(tdr_buildable * 10.764, 2) if zonal_data["tdr_available"] else 0,
            "additional_area_sqm": round(tdr_additional_area, 2) if zonal_data["tdr_available"] else 0,
            "tdr_cost_per_sqm": zonal_data["tdr_rate_per_sqm"],
            "total_tdr_cost_inr": round(tdr_total_cost, 2) if zonal_data["tdr_available"] else 0,
            "total_tdr_cost_lakhs": round(tdr_total_cost / 100000, 2) if zonal_data["tdr_available"] else 0,
        },
        "premium_fsi_option": {
            "fsi_premium": zonal_data["fsi_premium"],
            "buildable_area_sqm": round(premium_buildable, 2),
            "buildable_area_sqft": round(premium_buildable * 10.764, 2),
            "additional_area_sqm": round(premium_additional_area, 2),
            "premium_cost_per_sqm": zonal_data["premium_fsi_cost_per_sqm"],
            "total_premium_cost_inr": round(premium_total_cost, 2),
            "total_premium_cost_lakhs": round(premium_total_cost / 100000, 2),
        },
        "floor_regulations": {
            "max_floors_allowed": zonal_data["max_floors"],
            "max_height_meters": zonal_data["height_limit_m"],
            "ground_coverage_pct": zonal_data["ground_coverage"],
            "ground_floor_area_sqm": round(ground_floor_area, 2),
            "typical_floor_area_sqm": round(typical_floor_area, 2),
            "estimated_floors_with_base_fsi": actual_max_floors,
        },
        "setback_requirements": {
            "front_setback_m": zonal_data["setback_front_m"],
            "side_setback_m": zonal_data["setback_side_m"],
            "parking_requirement": zonal_data["parking_required"],
        },
        "regulations_summary": zonal_data["regulations"],
        "financial_comparison": {
            "base_fsi_cost": "₹0 (included in land cost)",
            "tdr_option_cost": f"₹{round(tdr_total_cost / 100000, 2)} lakhs" if zonal_data["tdr_available"] else "Not available",
            "premium_fsi_cost": f"₹{round(premium_total_cost / 100000, 2)} lakhs",
            "recommendation": "TDR option" if zonal_data["tdr_available"] and tdr_total_cost < premium_total_cost else "Premium FSI option" if not zonal_data["tdr_available"] else "Base FSI sufficient"
        }
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
