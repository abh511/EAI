"""
Anomaly Detection using Isolation Forest
Detects unusual environmental readings
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
from pathlib import Path

from app.ml.feature_engineering import EXTENDED_FEATURES, prepare_features, ANOMALY_SCALER_PATH

MODEL_PATH = Path(__file__).parent / "models" / "anomaly_detector.pkl"


def train_anomaly_detector(df: pd.DataFrame, contamination: float = 0.05, verbose: bool = True):
    """
    Train Isolation Forest for anomaly detection
    """
    if verbose:
        print("=" * 60)
        print("TRAINING ANOMALY DETECTION MODEL")
        print("=" * 60)
    
    # Prepare features
    X, scaler = prepare_features(df, EXTENDED_FEATURES, fit_scaler=True, scaler_path=ANOMALY_SCALER_PATH)
    
    if verbose:
        print(f"✅ Training data: {X.shape[0]} samples, {X.shape[1]} features")
    
    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X)
    
    # Predict on training data
    predictions = model.predict(X)
    anomaly_count = (predictions == -1).sum()
    
    if verbose:
        print(f"✅ Model trained")
        print(f"   Detected {anomaly_count} anomalies ({anomaly_count/len(X)*100:.2f}%) in training data")
    
    # Save model
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    
    if verbose:
        print(f"✅ Model saved to: {MODEL_PATH}")
        print("=" * 60)
    
    return model


def load_anomaly_detector():
    """Load pre-trained anomaly detector"""
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    else:
        raise FileNotFoundError(f"Anomaly detector not found at {MODEL_PATH}")


def detect_anomaly(features: dict) -> dict:
    """
    Check if environmental reading is anomalous
    """
    model = load_anomaly_detector()
    
    # Convert to DataFrame
    df_single = pd.DataFrame([features])
    
    # Prepare features
    scaler = joblib.load(ANOMALY_SCALER_PATH)
    X, _ = prepare_features(df_single, EXTENDED_FEATURES, fit_scaler=False, scaler=scaler, scaler_path=ANOMALY_SCALER_PATH)
    
    # Predict
    prediction = model.predict(X)[0]
    anomaly_score = float(model.score_samples(X)[0])
    
    is_anomaly = (prediction == -1)
    
    if is_anomaly:
        message = "⚠️ Unusual reading detected. Possible sensor malfunction or extraordinary environmental event."
    else:
        message = "✅ Reading within normal patterns."
    
    return {
        'is_anomaly': bool(is_anomaly),
        'anomaly_score': anomaly_score,
        'confidence': abs(anomaly_score),
        'message': message
    }
