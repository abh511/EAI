import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from functools import lru_cache
from loguru import logger
from app.core.config import settings

# Feature columns used for risk prediction
FEATURE_COLS = [
    "pm2_5_ug_m3", "pm10_ug_m3", "no2_ug_m3", "so2_ug_m3",
    "noise_day_dba", "water_bod_mg_l", "water_tds_mg_l",
    "gw_nitrate_mg_l", "nox_ug_m3", "uhi_intensity"
]

def _derive_risk_level(aqi: float) -> str:
    """Convert AQI value to risk level category"""
    if aqi <= 100:
        return "Low"
    elif aqi <= 200:
        return "Medium"
    elif aqi <= 300:
        return "High"
    else:
        return "Critical"

@lru_cache(maxsize=1)
def _train_model() -> RandomForestClassifier:
    """
    Train RandomForest classifier on environmental dataset.
    Cached to avoid retraining on every call.
    """
    dataset_path = Path(settings.DATASET_PATH)
    
    if not dataset_path.exists():
        logger.warning(f"Dataset not found at {dataset_path}. ML model unavailable.")
        return None
    
    try:
        df = pd.read_csv(dataset_path)
        logger.info(f"Loaded {len(df)} rows for ML training")
        
        # Derive risk labels from AQI
        if "aqi_us" not in df.columns:
            logger.error("Column 'aqi_us' not found in dataset")
            return None
        
        df["risk_level"] = df["aqi_us"].apply(_derive_risk_level)
        
        # Check if all required features exist
        missing_cols = [col for col in FEATURE_COLS if col not in df.columns]
        if missing_cols:
            logger.error(f"Missing feature columns: {missing_cols}")
            return None
        
        # Prepare training data
        X = df[FEATURE_COLS].fillna(df[FEATURE_COLS].median())
        y = df["risk_level"]
        
        # Train model
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        
        accuracy = model.score(X_test, y_test)
        logger.info(f"ML model trained successfully. Test accuracy: {accuracy:.3f}")
        
        return model
        
    except Exception as e:
        logger.error(f"Failed to train ML model: {str(e)}")
        return None

def predict_risk(features_dict: dict) -> dict:
    """
    Predict environmental risk level from feature dictionary.
    
    Args:
        features_dict: Dictionary with keys matching FEATURE_COLS
        
    Returns:
        {"risk_level": str, "confidence": float}
    """
    model = _train_model()
    
    if model is None:
        return {"risk_level": "Unknown", "confidence": 0.0}
    
    try:
        # Extract features in correct order
        feature_values = []
        for col in FEATURE_COLS:
            val = features_dict.get(col, 0)
            feature_values.append(float(val) if val is not None else 0.0)
        
        # Reshape for prediction
        X = np.array(feature_values).reshape(1, -1)
        
        # Get prediction and confidence
        risk_level = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]
        confidence = float(max(probabilities))
        
        return {
            "risk_level": risk_level,
            "confidence": round(confidence, 3)
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return {"risk_level": "Unknown", "confidence": 0.0}

__all__ = ["predict_risk"]
