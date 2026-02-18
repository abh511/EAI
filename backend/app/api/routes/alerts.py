"""
Alerts Router
Endpoints: /active, /history, /acknowledge/{id}
"""
from fastapi import APIRouter, HTTPException, Query, status
from app.services import generate_alerts
from loguru import logger

router = APIRouter()

@router.get("/active")
async def get_active_alerts(city: str = Query(...), location: str = Query(...)):
    """Get active alerts for a location"""
    try:
        alerts = generate_alerts(city, location)
        return {"alerts": alerts}
    except Exception as e:
        logger.error(f"Error fetching alerts for {location}, {city}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to fetch alerts")

@router.get("/history")
async def get_alert_history(city: str = Query(...), days: int = Query(7)):
    """Get alert history for a city"""
    try:
        # For now, return empty history
        # In production, this would query a database
        return {"alerts": []}
    except Exception as e:
        logger.error(f"Error fetching alert history for {city}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to fetch alert history")

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge an alert"""
    try:
        # In production, this would update the database
        logger.info(f"Alert {alert_id} acknowledged")
        return {
            "message": "Alert acknowledged",
            "alert_id": alert_id
        }
    except Exception as e:
        logger.error(f"Error acknowledging alert {alert_id}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to acknowledge alert")

@router.get("/ping")
async def ping():
    return {"router": "alerts", "status": "online"}
