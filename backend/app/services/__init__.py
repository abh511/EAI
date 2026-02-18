"""
EnviroWatch AI — Data Service
Reads the CSV dataset and serves it as if it were live DB queries.
Once Supabase is connected, swap these functions for real DB calls.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from functools import lru_cache
from loguru import logger

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "pune_mumbai_environmental_data_17022026.csv"

THRESHOLDS = {
    "pm2_5_ug_m3":          {"label": "PM2.5",       "unit": "µg/m³", "limit": 60,   "pillar": "air"},
    "pm10_ug_m3":           {"label": "PM10",         "unit": "µg/m³", "limit": 100,  "pillar": "air"},
    "no2_ug_m3":            {"label": "NO₂",          "unit": "µg/m³", "limit": 80,   "pillar": "air"},
    "so2_ug_m3":            {"label": "SO₂",          "unit": "µg/m³", "limit": 80,   "pillar": "air"},
    "noise_day_dba":        {"label": "Noise (Day)",  "unit": "dB(A)", "limit": 65,   "pillar": "noise"},
    "noise_night_dba":      {"label": "Noise (Night)","unit": "dB(A)", "limit": 55,   "pillar": "noise"},
    "water_bod_mg_l":       {"label": "Water BOD",    "unit": "mg/L",  "limit": 3,    "pillar": "water"},
    "water_tds_mg_l":       {"label": "Water TDS",    "unit": "mg/L",  "limit": 500,  "pillar": "water"},
    "gw_nitrate_mg_l":      {"label": "GW Nitrate",   "unit": "mg/L",  "limit": 45,   "pillar": "groundwater"},
    "gw_fluoride_mg_l":     {"label": "GW Fluoride",  "unit": "mg/L",  "limit": 1.5,  "pillar": "groundwater"},
    "nox_ug_m3":            {"label": "NOx",          "unit": "µg/m³", "limit": 80,   "pillar": "industrial"},
    "sox_ug_m3":            {"label": "SOx",          "unit": "µg/m³", "limit": 80,   "pillar": "industrial"},
    "uhi_intensity":        {"label": "UHI Intensity","unit": "°C",    "limit": 3.0,  "pillar": "heat"},
    "waste_landfill_pct":   {"label": "Landfill %",   "unit": "%",     "limit": 70,   "pillar": "waste"},
}

AUTHORITY_MAP = {
    "air":         "CPCB / MPCB",
    "water":       "MCGM / PMC Water Dept",
    "noise":       "MPCB Noise Cell",
    "industrial":  "MPCB Industrial Division",
    "groundwater": "CGWB Maharashtra",
    "heat":        "Urban Development Dept",
    "waste":       "PMC / BMC Solid Waste Dept",
}

@lru_cache(maxsize=1)
def load_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        logger.warning(f"Dataset not found at {DATA_PATH}. Using generated mock.")
        return _generate_mock()
    df = pd.read_csv(DATA_PATH, index_col=0)
    logger.info(f"Loaded dataset: {len(df)} rows from {DATA_PATH}")
    return df

def get_location_data(city: str, location: str) -> pd.DataFrame:
    df = load_data()
    mask = (df["city"].str.lower() == city.lower()) & \
           (df["location"].str.lower() == location.lower())
    return df[mask]

def get_latest_reading(city: str, location: str) -> dict:
    df = get_location_data(city, location)
    if df.empty:
        return {}
    return df.sample(1).iloc[0].to_dict()

def get_all_cities() -> dict:
    df = load_data()
    result = {}
    for city in df["city"].unique():
        locations = df[df["city"] == city][
            ["location", "latitude", "longitude", "zone_type"]
        ].drop_duplicates("location").to_dict("records")
        result[city] = locations
    return result

def generate_alerts(city: str, location: str) -> list:
    reading = get_latest_reading(city, location)
    if not reading:
        return []
    alerts = []
    sev_map = {0.5: "low", 1.0: "medium", 1.5: "high", 2.0: "critical"}
    for param, meta in THRESHOLDS.items():
        val = reading.get(param)
        if val is None:
            continue
        ratio = float(val) / meta["limit"]
        if ratio < 1.0:
            continue
        sev = "low"
        for threshold, label in sorted(sev_map.items()):
            if ratio >= threshold:
                sev = label
        alerts.append({
            "id":              f"ALT-{param[:6].upper()}-{abs(hash(location+param)) % 9999:04d}",
            "pillar":          meta["pillar"],
            "severity":        sev,
            "parameter":       meta["label"],
            "observed_value":  round(float(val), 2),
            "threshold_value": meta["limit"],
            "message":         f"{meta['label']} at {location} is {round(float(val),1)} {meta['unit']} "
                               f"({round((ratio-1)*100, 0):.0f}% above safe limit of {meta['limit']} {meta['unit']})",
            "authority":       AUTHORITY_MAP.get(meta["pillar"], "Concerned Authority"),
            "status":          "open",
            "location":        location,
            "city":            city,
            "created_at":      datetime.now().isoformat(),
        })
    alerts.sort(key=lambda x: {"critical": 0, "high": 1, "medium": 2, "low": 3}[x["severity"]])
    return alerts

def build_pillar_cards(reading: dict) -> list:
    if not reading:
        return []

    def status(val, limit):
        r = val / limit
        if r < 0.6:  return "good"
        if r < 0.9:  return "moderate"
        if r < 1.3:  return "unhealthy"
        return "critical"

    def trend():
        return np.random.choice(["up", "down", "stable"], p=[0.4, 0.3, 0.3])

    cards = [
        {"pillar": "air",         "label": "Air Quality",   "icon": "Wind",
         "value": reading.get("aqi_us", 0),         "unit": "AQI",
         "status": status(reading.get("aqi_us",0), 150),
         "trend": trend(),
         "description": f"PM2.5: {reading.get('pm2_5_ug_m3',0):.1f} µg/m³"},

        {"pillar": "water",       "label": "Water Quality", "icon": "Droplets",
         "value": reading.get("water_quality_index", 0), "unit": "WQI",
         "status": "good" if reading.get("water_quality_index",0) > 70 else "moderate" if reading.get("water_quality_index",0) > 50 else "unhealthy",
         "trend": trend(),
         "description": f"TDS: {reading.get('water_tds_mg_l',0):.0f} mg/L"},

        {"pillar": "noise",       "label": "Noise Level",   "icon": "Volume2",
         "value": reading.get("noise_day_dba", 0),   "unit": "dB(A)",
         "status": status(reading.get("noise_day_dba",0), 65),
         "trend": trend(),
         "description": f"Night: {reading.get('noise_night_dba',0):.1f} dB(A)"},

        {"pillar": "industrial",  "label": "Emissions",     "icon": "Factory",
         "value": reading.get("nox_ug_m3", 0),       "unit": "NOx µg/m³",
         "status": status(reading.get("nox_ug_m3",0), 80),
         "trend": trend(),
         "description": f"SOx: {reading.get('sox_ug_m3',0):.1f} µg/m³"},

        {"pillar": "waste",       "label": "Solid Waste",   "icon": "Trash2",
         "value": reading.get("recycling_pct", 0),   "unit": "% recycled",
         "status": "good" if reading.get("recycling_pct",0) > 40 else "moderate" if reading.get("recycling_pct",0) > 25 else "unhealthy",
         "trend": trend(),
         "description": f"Landfill: {reading.get('waste_landfill_pct',0):.1f}%"},

        {"pillar": "heat",        "label": "Urban Heat",    "icon": "Thermometer",
         "value": reading.get("ambient_temp_celsius", 0), "unit": "°C",
         "status": status(reading.get("uhi_intensity",0), 3.0),
         "trend": trend(),
         "description": f"UHI: +{reading.get('uhi_intensity',0):.1f}°C above baseline"},

        {"pillar": "groundwater", "label": "Groundwater",   "icon": "Layers",
         "value": reading.get("gw_tds_mg_l", 0),     "unit": "TDS mg/L",
         "status": status(reading.get("gw_tds_mg_l",0), 500),
         "trend": trend(),
         "description": f"Depth: {reading.get('gw_depth_m',0):.1f} m BGL"},
    ]
    return cards

def generate_forecast(city: str, location: str, pillar: str = "air") -> dict:
    reading = get_latest_reading(city, location)
    param_map = {
        "air":         ("aqi_us",            "AQI",      150, "AQI"),
        "water":       ("water_bod_mg_l",     "BOD",      3,   "mg/L"),
        "noise":       ("noise_day_dba",      "Noise",    65,  "dB(A)"),
        "industrial":  ("nox_ug_m3",          "NOx",      80,  "µg/m³"),
        "heat":        ("ambient_temp_celsius","Temp",     40,  "°C"),
        "groundwater": ("gw_tds_mg_l",        "GW TDS",   500, "mg/L"),
        "waste":       ("waste_landfill_pct", "Landfill", 70,  "%"),
    }
    col, label, threshold, unit = param_map.get(pillar, param_map["air"])
    base_val = float(reading.get(col, threshold * 0.8)) if reading else threshold * 0.8

    points = []
    now = datetime.now()
    val = base_val
    peak_time = None
    peak_val  = val

    for h in range(49):
        t = now + timedelta(hours=h)
        hour = t.hour
        # diurnal factor — peaks at rush hours
        factor = 1.0 + 0.25 * np.sin(np.pi * (hour - 6) / 12) if 6 <= hour <= 22 else 0.75
        noise  = np.random.normal(0, base_val * 0.04)
        val    = max(0, base_val * factor + noise)
        breach = val > threshold
        conf   = round(max(0.55, 1 - h * 0.008 + np.random.uniform(-0.03, 0.03)), 3)
        if val > peak_val:
            peak_val  = val
            peak_time = t.strftime("%Y-%m-%d %H:%M")
        points.append({
            "time":       t.strftime("%Y-%m-%d %H:%M"),
            "value":      round(float(val), 2),
            "will_breach": bool(breach),
            "confidence": float(conf),
        })

    breach_hours = sum(1 for p in points if p["will_breach"])
    summary = (
        f"⚠️  {label} is predicted to breach the {threshold} {unit} limit for "
        f"{breach_hours} hours in the next 48 hours. Peak expected at {peak_time}."
        if breach_hours > 0
        else f"✅  {label} is forecast to remain within safe limits for the next 48 hours."
    )
    return {
        "location": location, "city": city,
        "pillar": pillar, "parameter": label, "unit": unit,
        "threshold": float(threshold), "points": points,
        "peak_risk_time": peak_time if breach_hours > 0 else None,
        "summary": summary,
    }

def _generate_mock() -> pd.DataFrame:
    """Fallback if CSV not present"""
    np.random.seed(0)
    rows = []
    for city, locs in {"Pune": ["Viman Nagar", "Hadapsar"], "Mumbai": ["Dharavi", "Bandra West"]}.items():
        for loc in locs:
            for _ in range(50):
                rows.append({
                    "city": city, "location": loc, "zone_type": "Mixed",
                    "latitude": 18.5 + np.random.uniform(-0.1, 0.1),
                    "longitude": 73.8 + np.random.uniform(-0.1, 0.1),
                    "aqi_us": int(np.random.uniform(100, 250)),
                    "pm2_5_ug_m3": np.random.uniform(40, 150),
                    "pm10_ug_m3": np.random.uniform(80, 200),
                    "no2_ug_m3": np.random.uniform(30, 90),
                    "so2_ug_m3": np.random.uniform(10, 60),
                    "nox_ug_m3": np.random.uniform(40, 130),
                    "sox_ug_m3": np.random.uniform(10, 90),
                    "water_tds_mg_l": np.random.uniform(200, 700),
                    "water_bod_mg_l": np.random.uniform(1, 20),
                    "water_quality_index": np.random.uniform(30, 85),
                    "noise_day_dba": np.random.uniform(55, 90),
                    "noise_night_dba": np.random.uniform(45, 75),
                    "gw_tds_mg_l": np.random.uniform(300, 2000),
                    "gw_depth_m": np.random.uniform(5, 45),
                    "gw_nitrate_mg_l": np.random.uniform(10, 80),
                    "gw_fluoride_mg_l": np.random.uniform(0.2, 1.8),
                    "ambient_temp_celsius": np.random.uniform(26, 38),
                    "uhi_intensity": np.random.uniform(0.5, 7.0),
                    "green_cover_pct": np.random.uniform(3, 40),
                    "recycling_pct": np.random.uniform(10, 50),
                    "waste_landfill_pct": np.random.uniform(30, 85),
                })
    return pd.DataFrame(rows)