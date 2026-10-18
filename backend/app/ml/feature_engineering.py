"""
Feature Engineering Pipeline for ML Models
Prepares environmental data for training and prediction
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import joblib
from pathlib import Path
from typing import Tuple

SCALER_PATH = Path(__file__).parent / "models" / "feature_scaler.pkl"
ANOMALY_SCALER_PATH = Path(__file__).parent / "models" / "anomaly_scaler.pkl"

# Core features (most important 15)
CORE_FEATURES = [
    'pm2_5_ug_m3', 'pm10_ug_m3', 'no2_ug_m3', 'so2_ug_m3',           # Air (4)
    'water_bod_mg_l', 'water_tds_mg_l', 'water_quality_index',       # Water (3)
    'noise_day_dba',                                                  # Noise (1)
    'nox_ug_m3', 'sox_ug_m3',                                        # Industrial (2)
    'uhi_intensity', 'green_cover_pct',                              # Heat (2)
    'gw_nitrate_mg_l', 'gw_tds_mg_l',                                # Groundwater (2)
    'wind_speed_kmh'                                                  # Weather (1)
]

# Extended features (30 total, used by the anomaly detector)
EXTENDED_FEATURES = CORE_FEATURES + [
    'co_ug_m3', 'o3_ug_m3', 'water_ph', 'water_do_mg_l', 'water_turbidity_ntu',
    'noise_night_dba', 'noise_peak_dba', 'rspm_ug_m3', 'voc_ug_m3',
    'ambient_temp_celsius', 'relative_humidity_pct', 'gw_depth_m', 'gw_ph',
    'traffic_density', 'industrial_proximity_km'
]

# ── Risk forecasting ──────────────────────────────────────────────────────────
RISK_LABELS = ['Low', 'Medium', 'High', 'Critical']
FORECAST_HORIZON_MIN = 180   # predict the average risk over the next 3 hours
HISTORY_WINDOW_MIN = 60      # look-back window for the recent AQI average

# Inputs known at prediction time: the current reading, the last hour's AQI
# average and the time of day. Nothing from the future.
FORECAST_FEATURES = [
    'aqi_us', 'aqi_past60', 'pm2_5_ug_m3', 'pm10_ug_m3', 'no2_ug_m3', 'co_ug_m3',
    'wind_speed_kmh', 'rainfall_mm_24h', 'traffic_density', 'relative_humidity_pct',
    'hour_sin', 'hour_cos',
]

# EPA PM2.5 breakpoints: (conc_lo, conc_hi, aqi_lo, aqi_hi)
_PM25_BREAKPOINTS = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 350.4, 301, 400),
    (350.5, 500.4, 401, 500),
]


def pm25_to_aqi(pm25: float) -> int:
    """Convert PM2.5 (µg/m³) to US AQI using EPA breakpoints"""
    # EPA truncates to one decimal; without this, values such as 35.45 fall in
    # the gap between breakpoints
    c = np.floor(max(float(pm25), 0.0) * 10) / 10
    for lo_c, hi_c, lo_a, hi_a in _PM25_BREAKPOINTS:
        if lo_c <= c <= hi_c:
            return int(round((hi_a - lo_a) / (hi_c - lo_c) * (c - lo_c) + lo_a))
    return 500


def aqi_to_risk(aqi: float) -> int:
    """0 = Low (0-100), 1 = Medium (101-200), 2 = High (201-300), 3 = Critical (300+)"""
    if aqi <= 100:
        return 0
    if aqi <= 200:
        return 1
    if aqi <= 300:
        return 2
    return 3


def _add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    hours = df['timestamp'].dt.hour + df['timestamp'].dt.minute / 60
    return df.assign(
        hour_sin=np.sin(2 * np.pi * hours / 24),
        hour_cos=np.cos(2 * np.pi * hours / 24),
    )


def build_forecast_frame(df: pd.DataFrame, horizon_min: int = FORECAST_HORIZON_MIN) -> pd.DataFrame:
    """
    Turn raw readings into a supervised forecasting table.

    For every reading at time t (per location, time-ordered):
      - aqi_past60   = mean AQI over (t - 60 min, t]       (known now)
      - future_aqi   = mean AQI over (t, t + horizon]      (the target)
      - target_risk  = risk class of future_aqi
    Readings whose horizon runs past the end of the data are dropped.
    """
    frames = []
    data = df.assign(timestamp=pd.to_datetime(df['timestamp']))
    horizon = np.timedelta64(horizon_min, 'm')
    for _, g in data.sort_values('timestamp').groupby('location'):
        aqi = pd.Series(g['aqi_us'].to_numpy(dtype=float), index=g['timestamp'])
        times = g['timestamp'].to_numpy()
        values = aqi.to_numpy()
        csum = np.concatenate([[0.0], np.cumsum(values)])
        # Indices bounding (t, t + horizon] for each reading
        start = np.searchsorted(times, times, side='right')
        end = np.searchsorted(times, times + horizon, side='right')
        complete = times + horizon <= times[-1]
        counts = end - start
        with np.errstate(invalid='ignore', divide='ignore'):
            future = (csum[end] - csum[start]) / counts
        future[~complete | (counts == 0)] = np.nan
        frames.append(g.assign(
            aqi_past60=aqi.rolling(f'{HISTORY_WINDOW_MIN}min').mean().to_numpy(),
            future_aqi=future,
        ))
    out = pd.concat(frames).dropna(subset=['future_aqi'])
    out['target_risk'] = out['future_aqi'].apply(aqi_to_risk).astype(int)
    return _add_time_features(out)


def forecast_features(reading: dict, history: pd.DataFrame) -> pd.DataFrame:
    """
    Build the single-row feature frame for a live prediction.
    `history` holds this location's readings up to and including `reading`.
    """
    ts = pd.to_datetime(reading['timestamp'])
    hist = history.assign(timestamp=pd.to_datetime(history['timestamp']))
    window = hist[(hist['timestamp'] > ts - pd.Timedelta(minutes=HISTORY_WINDOW_MIN)) & (hist['timestamp'] <= ts)]
    aqi_past60 = float(window['aqi_us'].mean()) if not window.empty else float(reading['aqi_us'])
    row = pd.DataFrame([{**reading, 'timestamp': ts, 'aqi_past60': aqi_past60}])
    return _add_time_features(row)[FORECAST_FEATURES]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create derived features that improve model performance
    """
    df_eng = df.copy()
    
    # Pollution ratios (helps model understand relative pollution)
    df_eng['pm_ratio'] = df_eng['pm2_5_ug_m3'] / (df_eng['pm10_ug_m3'] + 1)
    df_eng['nox_sox_ratio'] = df_eng['nox_ug_m3'] / (df_eng['sox_ug_m3'] + 1)
    
    # Water pollution index (combined score)
    df_eng['water_pollution_score'] = (
        (df_eng['water_bod_mg_l'] / 3) * 0.3 +
        (df_eng['water_tds_mg_l'] / 500) * 0.2 +
        (1 - df_eng['water_do_mg_l'] / 8) * 0.3 +
        (df_eng['water_turbidity_ntu'] / 5) * 0.2
    ).clip(0, 10)
    
    # Noise pollution index
    df_eng['noise_violation'] = (
        (df_eng['noise_day_dba'] > 55).astype(int) +
        (df_eng['noise_night_dba'] > 45).astype(int)
    )
    
    # Urban environment score
    df_eng['urban_stress'] = (
        df_eng['uhi_intensity'] * 0.3 +
        (100 - df_eng['green_cover_pct']) * 0.01 * 0.3 +
        df_eng['traffic_density'] * 0.01 * 0.4
    )
    
    # Industrial impact score
    df_eng['industrial_impact'] = (
        df_eng['nox_ug_m3'] / 80 * 0.4 +
        df_eng['sox_ug_m3'] / 80 * 0.3 +
        df_eng['voc_ug_m3'] / 50 * 0.3
    ).clip(0, 5)
    
    return df_eng


def prepare_features(
    df: pd.DataFrame,
    feature_list: list = CORE_FEATURES,
    fit_scaler: bool = False,
    scaler: StandardScaler = None,
    scaler_path: Path = None
) -> Tuple[np.ndarray, StandardScaler]:
    """
    Prepare feature matrix for ML models
    
    Steps:
    1. Select features
    2. Handle missing values (impute with median)
    3. Scale features (standardization)
    """
    # Engineer derived features
    df_eng = engineer_features(df)
    
    # Select features
    available_features = [f for f in feature_list if f in df_eng.columns]
    X = df_eng[available_features].copy()
    
    # Determine scaler path
    if scaler_path is None:
        scaler_path = SCALER_PATH
    
    # Scale features
    if fit_scaler:
        # Handle missing values with median imputation
        imputer = SimpleImputer(strategy='median')
        X_imputed = imputer.fit_transform(X)
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_imputed)
        
        # Save scaler
        scaler_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(scaler, scaler_path)
    else:
        if scaler is None:
            if scaler_path.exists():
                scaler = joblib.load(scaler_path)
            else:
                raise ValueError(f"No scaler provided and no saved scaler found at {scaler_path}. Train model first.")
        
        X_values = X.to_numpy(dtype=float)
        if X_values.shape[1] != scaler.n_features_in_:
            raise ValueError(
                f"Expected {scaler.n_features_in_} features but got {X_values.shape[1]}. Retrain models."
            )
        # Fitting an imputer on a single row drops all-NaN columns, so fill gaps
        # with the training means the scaler already holds
        nan_mask = np.isnan(X_values)
        if nan_mask.any():
            X_values[nan_mask] = np.take(scaler.mean_, np.where(nan_mask)[1])
        X_scaled = scaler.transform(X_values)
    
    return X_scaled, scaler
