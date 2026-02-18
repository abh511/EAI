"""
Dashboard Router
Endpoints: /summary, /pillars, /city-overview
"""
from fastapi import APIRouter, HTTPException, Query, status
from app.services import get_latest_reading, build_pillar_cards, generate_alerts, get_all_cities
from datetime import datetime
from loguru import logger

router = APIRouter()

@router.get("/summary")
async def get_summary(city: str = Query(...), location: str = Query(...)):
    """Get comprehensive dashboard summary for a location"""
    try:
        reading = get_latest_reading(city, location)
        
        if not reading:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"No data found for {location}, {city}")
        
        pillars = build_pillar_cards(reading)
        alerts = generate_alerts(city, location)
        
        aqi = int(reading.get("aqi_us", 0))
        
        # Determine AQI category
        if aqi <= 50:
            aqi_category = "Good"
            overall_risk = "low"
        elif aqi <= 100:
            aqi_category = "Moderate"
            overall_risk = "low"
        elif aqi <= 150:
            aqi_category = "Unhealthy for Sensitive Groups"
            overall_risk = "medium"
        elif aqi <= 200:
            aqi_category = "Unhealthy"
            overall_risk = "medium"
        elif aqi <= 300:
            aqi_category = "Very Unhealthy"
            overall_risk = "high"
        else:
            aqi_category = "Hazardous"
            overall_risk = "critical"
        
        return {
            "city": city,
            "location": location,
            "zone_type": reading.get("zone_type", "Mixed"),
            "aqi": aqi,
            "aqi_category": aqi_category,
            "overall_risk": overall_risk,
            "pillars": pillars,
            "active_alerts": len(alerts),
            "last_updated": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching summary for {location}, {city}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to fetch dashboard summary")

@router.get("/pillars")
async def get_pillars(city: str = Query(...), location: str = Query(...)):
    """Get pillar cards for a location"""
    try:
        reading = get_latest_reading(city, location)
        
        if not reading:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"No data found for {location}, {city}")
        
        pillars = build_pillar_cards(reading)
        
        return {"pillars": pillars}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching pillars for {location}, {city}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to fetch pillars")

@router.get("/city-overview")
async def get_city_overview(city: str = Query(...)):
    """Get city-wide overview with all locations"""
    try:
        cities_data = get_all_cities()
        
        # Find the city (case-insensitive)
        city_locations = None
        for city_name, locations in cities_data.items():
            if city_name.lower() == city.lower():
                city_locations = locations
                break
        
        if not city_locations:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"City '{city}' not found")
        
        # Get data for each location
        location_summaries = []
        total_aqi = 0
        
        for loc in city_locations:
            location_name = loc["location"]
            reading = get_latest_reading(city, location_name)
            
            if reading:
                aqi = int(reading.get("aqi_us", 0))
                total_aqi += aqi
                
                # Determine risk level
                if aqi <= 100:
                    risk = "low"
                elif aqi <= 200:
                    risk = "medium"
                elif aqi <= 300:
                    risk = "high"
                else:
                    risk = "critical"
                
                location_summaries.append({
                    "name": location_name,
                    "aqi": aqi,
                    "risk": risk,
                    "latitude": loc["latitude"],
                    "longitude": loc["longitude"]
                })
        
        avg_aqi = int(total_aqi / len(location_summaries)) if location_summaries else 0
        
        return {
            "city": city,
            "total_locations": len(location_summaries),
            "avg_aqi": avg_aqi,
            "locations": location_summaries
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching city overview for {city}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to fetch city overview for {city}")

@router.get("/ping")
async def ping():
    return {"router": "dashboard", "status": "online"}
