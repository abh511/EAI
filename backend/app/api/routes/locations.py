"""
Locations Router
Endpoints: /list, /{city}
"""
from fastapi import APIRouter, HTTPException, status
from app.services import get_all_cities
from loguru import logger

router = APIRouter()

@router.get("/list")
async def list_cities():
    """Get all cities with their locations"""
    try:
        cities_data = get_all_cities()
        return {"cities": cities_data}
    except Exception as e:
        logger.error(f"Error fetching cities: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to fetch cities")

# Must be registered before "/{city}", otherwise "/ping" is captured as a city name
@router.get("/ping")
async def ping():
    return {"router": "locations", "status": "online"}

@router.get("/{city}")
async def get_city_locations(city: str):
    """Get all locations for a specific city"""
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
        
        # Format locations for response
        formatted_locations = []
        for loc in city_locations:
            formatted_locations.append({
                "id": f"{city.lower()}-{loc['location'].lower().replace(' ', '-')}",
                "name": loc["location"],
                "zone_type": loc.get("zone_type", "Mixed"),
                "latitude": loc["latitude"],
                "longitude": loc["longitude"],
                "is_coastal": False,
                "city_name": city
            })
        
        return {
            "city": city,
            "locations": formatted_locations
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching locations for {city}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to fetch locations for {city}")
