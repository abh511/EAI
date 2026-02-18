"""
Grievance Router
Endpoints: /submit, /status/{id}
"""
from fastapi import APIRouter, HTTPException, status
from app.schemas import GrievanceSubmit
from datetime import datetime
from loguru import logger
import uuid

router = APIRouter()

@router.post("/submit", status_code=201)
async def submit_grievance(grievance: GrievanceSubmit):
    """Submit a new citizen grievance"""
    try:
        # Generate tracking ID
        tracking_id = f"GRV-{datetime.now().year}-{str(uuid.uuid4())[:6].upper()}"
        
        logger.info(f"Grievance submitted: {tracking_id} for {grievance.location_name}, {grievance.city}")
        
        # In production, this would save to database
        return {
            "id": str(uuid.uuid4()),
            "status": "submitted",
            "message": "Grievance submitted successfully",
            "tracking_id": tracking_id
        }
    except Exception as e:
        logger.error(f"Error submitting grievance: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to submit grievance")

@router.get("/status/{tracking_id}")
async def get_grievance_status(tracking_id: str):
    """Get grievance status by tracking ID"""
    try:
        # In production, this would query the database
        return {
            "tracking_id": tracking_id,
            "status": "under_review",
            "submitted_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching grievance status for {tracking_id}: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to fetch grievance status")

@router.get("/ping")
async def ping():
    return {"router": "grievance", "status": "online"}
