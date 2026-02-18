"""
Forecast Router
Endpoints: /48hr/{location}, /trend/{pillar}
"""
from fastapi import APIRouter, HTTPException, Query, status
from app.services import generate_forecast
from loguru import logger

router = APIRouter()

@router.get("/48hr/{location}")
async def get_48hr_forecast(location: str, city: str = Query(...), pillar: str = Query("air")):
    """Get 48-hour forecast for a location and pillar"""
    try:
        forecast_data = generate_forecast(city, location, pillar)
        return forecast_data
    except Exception as e:
        logger.error(f"Error generating forecast for {location}, {city}, {pillar}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to generate forecast")

@router.get("/trend/{pillar}")
async def get_trend(pillar: str, city: str = Query(...), location: str = Query(...)):
    """Get trend data for a specific pillar"""
    try:
        # For now, redirect to 48hr forecast
        forecast_data = generate_forecast(city, location, pillar)
        return forecast_data
    except Exception as e:
        logger.error(f"Error generating trend for {pillar}, {location}, {city}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to generate trend")

@router.get("/ping")
async def ping():
    return {"router": "forecast", "status": "online"}
