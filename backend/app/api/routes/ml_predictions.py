"""
Machine Learning Prediction Endpoints
Real trained models (not rules)
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Optional

from app.ml.risk_classifier import predict_risk, get_model_info
from app.ml.anomaly_detector import detect_anomaly
from app.services import get_latest_reading, get_reading_with_history

router = APIRouter()


class PredictionResponse(BaseModel):
    risk_level: str
    risk_score: int
    confidence: float
    probabilities: Dict[str, float]
    model: str
    n_features_used: int
    horizon_hours: Optional[int] = None
    current_aqi: Optional[int] = None
    current_risk_level: Optional[str] = None
    safety_override: bool = False


@router.get("/predict-risk", response_model=PredictionResponse)
async def ml_predict_risk(city: str = Query(...), location: str = Query(...)):
    """
    Forecast the average risk level over the next 3 hours (ML ensemble).

    Also returns the current risk, computed directly from the AQI formula.
    If the air is hazardous right now, the forecast is forced to Critical.
    """
    reading, history = get_reading_with_history(city, location)
    
    if not reading:
        raise HTTPException(status_code=404, detail=f"No data for {location}, {city}")
    
    # ML prediction
    try:
        prediction = predict_risk(reading, history)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    
    return prediction


@router.get("/detect-anomaly")
async def ml_detect_anomaly(city: str = Query(...), location: str = Query(...)):
    """
    Detect if current reading is anomalous (using Isolation Forest)
    
    Identifies unusual patterns that may indicate:
    - Sensor malfunction
    - Extraordinary environmental event
    - Data quality issues
    """
    reading = get_latest_reading(city, location)
    
    if not reading:
        raise HTTPException(status_code=404, detail=f"No data for {location}, {city}")
    
    try:
        result = detect_anomaly(reading)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    
    return result


@router.get("/model-info")
async def ml_model_info():
    """
    Get information about trained models
    
    Returns accuracy, training data size, features used, etc.
    """
    info = get_model_info()
    return info
