"""
Anomaly Detection
Two layers:
  1. Rule checks: physically impossible values, and values far outside the
     range seen in training. Isolation Forest is weak here because trees treat
     any value beyond the training range like the most extreme training value.
  2. Isolation Forest: unusual combinations of otherwise normal values.
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import json
from pathlib import Path

from app.ml.feature_engineering import EXTENDED_FEATURES, prepare_features, ANOMALY_SCALER_PATH

MODEL_PATH = Path(__file__).parent / "models" / "anomaly_detector.pkl"
BOUNDS_PATH = Path(__file__).parent / "models" / "anomaly_bounds.json"

# Values outside these limits cannot come from a working sensor
PHYSICAL_LIMITS = {
    'aqi_us':                  (0, 500),
    'pm2_5_ug_m3':             (0, 1000),
    'pm10_ug_m3':              (0, 2000),
    'no2_ug_m3':               (0, 2000),
    'so2_ug_m3':               (0, 2000),
    'co_ug_m3':                (0, 50000),
    'o3_ug_m3':                (0, 1000),
    'nox_ug_m3':               (0, 2000),
    'sox_ug_m3':               (0, 2000),
    'rspm_ug_m3':              (0, 2000),
    'voc_ug_m3':               (0, 5000),
    'water_ph':                (0, 14),
    'gw_ph':                   (0, 14),
    'water_do_mg_l':           (0, 20),
    'water_bod_mg_l':          (0, 1000),
    'water_tds_mg_l':          (0, 50000),
    'water_turbidity_ntu':     (0, 4000),
    'water_quality_index':     (0, 100),
    'noise_day_dba':           (20, 130),
    'noise_night_dba':         (20, 130),
    'noise_peak_dba':          (20, 140),
    'ambient_temp_celsius':    (-10, 55),
    'relative_humidity_pct':   (0, 100),
    'green_cover_pct':         (0, 100),
    'traffic_density':         (0, 100),
    'wind_speed_kmh':          (0, 250),
    'uhi_intensity':           (-5, 15),
    'gw_depth_m':              (0, 500),
    'gw_tds_mg_l':             (0, 50000),
    'gw_nitrate_mg_l':         (0, 1000),
    'industrial_proximity_km': (0, 500),
}

# How far past the observed training range a value may go, as a fraction of that range
RANGE_MARGIN = 0.5


def train_anomaly_detector(df: pd.DataFrame, contamination: float = 0.05, verbose: bool = True):
    """
    Train Isolation Forest and record the observed range of every feature
    """
    if verbose:
        print("=" * 60)
        print("TRAINING ANOMALY DETECTION MODEL")
        print("=" * 60)

    X, scaler = prepare_features(df, EXTENDED_FEATURES, fit_scaler=True, scaler_path=ANOMALY_SCALER_PATH)

    if verbose:
        print(f"✅ Training data: {X.shape[0]} samples, {X.shape[1]} features")

    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X)

    predictions = model.predict(X)
    anomaly_count = (predictions == -1).sum()

    # Observed range per feature, widened by RANGE_MARGIN
    bounds = {}
    for col in sorted(set(EXTENDED_FEATURES + ['aqi_us']) & set(df.columns)):
        lo, hi = float(df[col].min()), float(df[col].max())
        margin = (hi - lo) * RANGE_MARGIN
        bounds[col] = [lo - margin, hi + margin]

    if verbose:
        print(f"✅ Model trained")
        print(f"   Detected {anomaly_count} anomalies ({anomaly_count/len(X)*100:.2f}%) in training data")
        print(f"   Recorded value ranges for {len(bounds)} features")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    with open(BOUNDS_PATH, 'w') as f:
        json.dump(bounds, f, indent=2)

    if verbose:
        print(f"✅ Model saved to: {MODEL_PATH}")
        print("=" * 60)

    return model


def load_anomaly_detector():
    """Load pre-trained anomaly detector"""
    if MODEL_PATH.exists() and BOUNDS_PATH.exists():
        return joblib.load(MODEL_PATH)
    raise FileNotFoundError(f"Anomaly detector not found at {MODEL_PATH}. Run training first.")


def _rule_violations(features: dict) -> list:
    with open(BOUNDS_PATH) as f:
        bounds = json.load(f)

    reasons = []
    flagged = set()
    for col, (lo, hi) in PHYSICAL_LIMITS.items():
        val = features.get(col)
        if val is None or pd.isna(val):
            continue
        if not lo <= float(val) <= hi:
            reasons.append(f"{col} = {val} is physically impossible (valid {lo}–{hi})")
            flagged.add(col)
    for col, (lo, hi) in bounds.items():
        val = features.get(col)
        if col in flagged or val is None or pd.isna(val):
            continue
        if not lo <= float(val) <= hi:
            reasons.append(f"{col} = {val} is far outside the observed range ({lo:.1f}–{hi:.1f})")
    return reasons


def detect_anomaly(features: dict) -> dict:
    """
    Check if environmental reading is anomalous
    """
    model = load_anomaly_detector()
    reasons = _rule_violations(features)

    df_single = pd.DataFrame([features])
    scaler = joblib.load(ANOMALY_SCALER_PATH)
    X, _ = prepare_features(df_single, EXTENDED_FEATURES, fit_scaler=False, scaler=scaler, scaler_path=ANOMALY_SCALER_PATH)

    model_flag = bool(model.predict(X)[0] == -1)
    anomaly_score = float(model.score_samples(X)[0])

    is_anomaly = model_flag or bool(reasons)
    if reasons:
        message = "⚠️ Invalid reading. Likely sensor malfunction."
    elif model_flag:
        message = "⚠️ Unusual reading detected. Possible sensor malfunction or extraordinary environmental event."
    else:
        message = "✅ Reading within normal patterns."

    return {
        'is_anomaly': is_anomaly,
        'anomaly_score': anomaly_score,
        'confidence': abs(anomaly_score),
        'message': message,
        'reasons': reasons,
        'detected_by': [name for name, hit in [('rules', bool(reasons)), ('isolation_forest', model_flag)] if hit],
    }
