import pandas as pd
import pytest
from httpx import AsyncClient

from app.ml.anomaly_detector import BOUNDS_PATH, MODEL_PATH as ANOMALY_MODEL_PATH, detect_anomaly
from app.ml.feature_engineering import aqi_to_risk, build_forecast_frame, pm25_to_aqi
from app.ml.risk_classifier import MODEL_PATH as RISK_MODEL_PATH, predict_risk
from app.services import get_reading_with_history, load_data

models_missing = pytest.mark.skipif(
    not (RISK_MODEL_PATH.exists() and ANOMALY_MODEL_PATH.exists() and BOUNDS_PATH.exists()),
    reason="ML models not trained (run scripts/train_all_models.py)",
)


@pytest.mark.parametrize("pm25, aqi", [(0, 0), (12.05, 50), (35.45, 100), (150.45, 200), (400, 434), (600, 500)])
def test_pm25_to_aqi_has_no_breakpoint_gaps(pm25, aqi):
    assert pm25_to_aqi(pm25) == aqi


def test_forecast_target_uses_only_future_readings():
    t0 = pd.Timestamp("2026-02-17 00:00")
    df = pd.DataFrame({
        "location": "X",
        "timestamp": [t0 + pd.Timedelta(minutes=m) for m in (0, 60, 120, 180, 240)],
        "aqi_us": [50, 150, 250, 350, 90],
        "hour": 0,
    })
    frame = build_forecast_frame(df, horizon_min=180)
    first = frame.iloc[0]
    # (0, 180] holds 150, 250, 350; the reading at t itself is excluded
    assert first["future_aqi"] == pytest.approx(250)
    assert first["target_risk"] == aqi_to_risk(250)
    # Readings whose 3-hour horizon runs past the data are dropped
    assert len(frame) == 2


@models_missing
def test_hazardous_air_is_always_forecast_critical():
    reading, history = get_reading_with_history("Mumbai", "Dharavi")
    reading = {**reading, "pm2_5_ug_m3": 400.0, "aqi_us": 434}
    result = predict_risk(reading, history)
    assert result["risk_level"] == "Critical"
    assert result["current_risk_level"] == "Critical"


@models_missing
def test_impossible_sensor_reading_is_flagged():
    reading = load_data().median(numeric_only=True).to_dict()
    reading.update(water_ph=1.0, noise_day_dba=140, pm2_5_ug_m3=900)
    result = detect_anomaly(reading)
    assert result["is_anomaly"]
    assert "rules" in result["detected_by"]
    assert any("noise_day_dba" in r for r in result["reasons"])


@models_missing
def test_normal_reading_passes_rule_checks():
    reading = load_data().iloc[0].to_dict()
    assert detect_anomaly(reading)["reasons"] == []


@models_missing
@pytest.mark.asyncio
async def test_predict_risk_endpoint(client: AsyncClient):
    response = await client.get("/api/ml/predict-risk", params={"city": "Pune", "location": "Baner"})
    assert response.status_code == 200
    data = response.json()
    assert data["horizon_hours"] == 3
    assert sum(data["probabilities"].values()) == pytest.approx(1.0, abs=1e-6)
