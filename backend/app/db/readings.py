"""
Mapping between the dataset (CSV) column names used throughout the app and the
env_readings table in Supabase, plus a loader that returns database rows in the
exact shape of the CSV.
"""
import pandas as pd
from loguru import logger

# Dataset column → env_readings column
COLUMN_MAP = {
    "timestamp": "recorded_at",
    "latitude": "latitude",
    "longitude": "longitude",
    # Air
    "pm2_5_ug_m3": "pm2_5",
    "pm10_ug_m3": "pm10",
    "no2_ug_m3": "no2",
    "so2_ug_m3": "so2",
    "co_ug_m3": "co",
    "o3_ug_m3": "o3",
    "aqi_us": "aqi_us",
    "aqi_category": "aqi_category",
    # Water
    "water_ph": "water_ph",
    "water_tds_mg_l": "water_tds",
    "water_bod_mg_l": "water_bod",
    "water_cod_mg_l": "water_cod",
    "water_do_mg_l": "water_do",
    "water_turbidity_ntu": "water_turbidity",
    "water_coliform_mpn": "water_coliform",
    "water_hardness_mg_l": "water_hardness",
    "water_chloride_mg_l": "water_chloride",
    "water_nitrate_mg_l": "water_nitrate",
    "water_quality_index": "water_wqi",
    "water_quality_grade": "water_grade",
    # Noise
    "noise_day_dba": "noise_day_dba",
    "noise_night_dba": "noise_night_dba",
    "noise_peak_dba": "noise_peak_dba",
    "noise_zone": "noise_zone",
    "noise_compliance": "noise_compliance",
    # Emissions
    "industrial_activity": "industrial_activity",
    "nox_ug_m3": "nox",
    "sox_ug_m3": "sox",
    "spm_ug_m3": "spm",
    "rspm_ug_m3": "rspm",
    "voc_ug_m3": "voc",
    "stack_temp_celsius": "stack_temp",
    "emission_category": "emission_category",
    # Waste
    "waste_gen_kg_sqkm_day": "waste_gen",
    "waste_recycling_pct": "recycling_pct",
    "waste_landfill_pct": "landfill_pct",
    "waste_compost_pct": "compost_pct",
    "waste_per_capita_kg": "waste_per_capita_kg",
    "litter_index": "litter_index",
    # Urban heat
    "ambient_temp_celsius": "ambient_temp",
    "surface_temp_celsius": "surface_temp",
    "lst_anomaly_celsius": "lst_anomaly",
    "uhi_intensity": "uhi_intensity",
    "relative_humidity_pct": "humidity_pct",
    "heat_index_celsius": "heat_index",
    "green_cover_pct": "green_cover_pct",
    # Groundwater
    "gw_depth_m": "gw_depth_m",
    "gw_tds_mg_l": "gw_tds",
    "gw_ph": "gw_ph",
    "gw_nitrate_mg_l": "gw_nitrate",
    "gw_fluoride_mg_l": "gw_fluoride",
    "gw_ec_us_cm": "gw_ec",
    "gw_hardness_mg_l": "gw_hardness",
    "gw_iron_mg_l": "gw_iron",
    "gw_arsenic_mg_l": "gw_arsenic",
    "gw_chloride_mg_l": "gw_chloride",
    "gw_suitability": "gw_suitability",
    # Weather & context
    "wind_speed_kmh": "wind_speed_kmh",
    "rainfall_mm_24h": "rainfall_mm",
    "traffic_density": "traffic_density",
    "industrial_proximity_km": "industrial_proximity_km",
}

# Dataset timestamps are local (IST) without a timezone
LOCAL_TZ = "Asia/Kolkata"
PAGE_SIZE = 1000


def fetch_readings_df(client) -> pd.DataFrame:
    """Load every env_readings row, joined with its location and city, as a CSV-shaped DataFrame"""
    select = ",".join(COLUMN_MAP.values()) + ",locations(name,zone_type,cities(name))"
    rows, start = [], 0
    while True:
        page = (
            client.table("env_readings").select(select)
            .order("recorded_at").order("id")
            .range(start, start + PAGE_SIZE - 1)
            .execute().data
        )
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
        start += PAGE_SIZE

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    loc = pd.json_normalize(df.pop("locations"))
    df = df.rename(columns={db: csv for csv, db in COLUMN_MAP.items()})
    df["location"] = loc["name"].to_numpy()
    df["zone_type"] = loc["zone_type"].to_numpy()
    df["city"] = loc["cities.name"].to_numpy()

    ts = pd.to_datetime(df["timestamp"], utc=True).dt.tz_convert(LOCAL_TZ).dt.tz_localize(None)
    df["timestamp"] = ts.dt.strftime("%Y-%m-%d %H:%M:%S")
    df["date"] = ts.dt.strftime("%d-%m-%Y")
    df["time"] = ts.dt.strftime("%H:%M:%S")
    df["hour"] = ts.dt.hour
    logger.info(f"Loaded {len(df)} readings from Supabase")
    return df
