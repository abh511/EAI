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
RISK_SCALER_PATH = Path(__file__).parent / "models" / "risk_scaler.pkl"
ANOMALY_SCALER_PATH = Path(__file__).parent / "models" / "anomaly_scaler.pkl"

# Core features for risk prediction (most important 15)
CORE_FEATURES = [
    'pm2_5_ug_m3', 'pm10_ug_m3', 'no2_ug_m3', 'so2_ug_m3',           # Air (4)
    'water_bod_mg_l', 'water_tds_mg_l', 'water_quality_index',       # Water (3)
    'noise_day_dba',                                                  # Noise (1)
    'nox_ug_m3', 'sox_ug_m3',                                        # Industrial (2)
    'uhi_intensity', 'green_cover_pct',                              # Heat (2)
    'gw_nitrate_mg_l', 'gw_tds_mg_l',                                # Groundwater (2)
    'wind_speed_kmh'                                                  # Weather (1)
]

# Extended features (30 total for advanced models)
EXTENDED_FEATURES = CORE_FEATURES + [
    'co_ug_m3', 'o3_ug_m3', 'water_ph', 'water_do_mg_l', 'water_turbidity_ntu',
    'noise_night_dba', 'noise_peak_dba', 'rspm_ug_m3', 'voc_ug_m3',
    'ambient_temp_celsius', 'humidity_pct', 'gw_depth_m', 'gw_ph',
    'traffic_density', 'industrial_proximity_km'
]


def create_risk_labels(df: pd.DataFrame) -> pd.Series:
    """
    Create risk level labels from AQI (ground truth for supervised learning)
    
    Labels:
        0 = Low Risk (AQI 0-100)
        1 = Medium Risk (AQI 101-200)
        2 = High Risk (AQI 201-300)
        3 = Critical Risk (AQI 300+)
    """
    def aqi_to_risk(aqi):
        if pd.isna(aqi):
            return np.nan
        if aqi <= 100:
            return 0
        elif aqi <= 200:
            return 1
        elif aqi <= 300:
            return 2
        else:
            return 3
    
    return df['aqi_us'].apply(aqi_to_risk)


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
    
    # Handle missing values with median imputation
    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)
    
    # Determine scaler path
    if scaler_path is None:
        scaler_path = SCALER_PATH
    
    # Scale features
    if fit_scaler:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_imputed)
        
        # Save scaler
        scaler_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(scaler, scaler_path)
    else:
        if scaler is None:
            if scaler_path.exists():
                scaler = joblib.load(scaler_path)
                X_scaled = scaler.transform(X_imputed)
            else:
                raise ValueError(f"No scaler provided and no saved scaler found at {scaler_path}. Train model first.")
        else:
            X_scaled = scaler.transform(X_imputed)
    
    return X_scaled, scaler
