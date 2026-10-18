"""
Grievance Router
Endpoints: /submit, /status/{id}
In database mode (DATA_SOURCE=supabase) grievances are stored in the grievances table.
"""
from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from app.schemas import GrievanceSubmit
from app.core.config import settings
from app.db import get_supabase_client
from datetime import datetime
from loguru import logger
import uuid

router = APIRouter()


def _db_enabled() -> bool:
    return settings.DATA_SOURCE.lower() == "supabase"


def _save_grievance(grievance: GrievanceSubmit, tracking_id: str) -> str:
    client = get_supabase_client()
    loc = (
        client.table("locations").select("id, cities!inner(name)")
        .eq("name", grievance.location_name).ilike("cities.name", grievance.city)
        .limit(1).execute().data
    )
    row = client.table("grievances").insert({
        "tracking_id": tracking_id,
        "location_id": loc[0]["id"] if loc else None,
        "pillar": grievance.pillar,
        "description": grievance.description,
        "latitude": grievance.latitude,
        "longitude": grievance.longitude,
    }).execute().data
    return row[0]["id"]


def _find_grievance(tracking_id: str):
    rows = (
        get_supabase_client().table("grievances")
        .select("tracking_id, status, pillar, created_at")
        .eq("tracking_id", tracking_id).limit(1).execute().data
    )
    return rows[0] if rows else None


@router.post("/submit", status_code=201)
async def submit_grievance(grievance: GrievanceSubmit):
    """Submit a new citizen grievance"""
    tracking_id = f"GRV-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    grievance_id = str(uuid.uuid4())

    if _db_enabled():
        try:
            grievance_id = await run_in_threadpool(_save_grievance, grievance, tracking_id)
        except Exception as e:
            logger.error(f"Error saving grievance: {str(e)}")
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Could not save grievance, please try again")

    logger.info(f"Grievance submitted: {tracking_id} for {grievance.location_name}, {grievance.city}")
    return {
        "id": grievance_id,
        "status": "submitted",
        "message": "Grievance submitted successfully",
        "tracking_id": tracking_id,
        "stored": _db_enabled(),
    }


@router.get("/status/{tracking_id}")
async def get_grievance_status(tracking_id: str):
    """Get grievance status by tracking ID"""
    if not _db_enabled():
        # Without a database nothing is stored, so there is no real status to report
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Grievance tracking needs DATA_SOURCE=supabase")
    try:
        row = await run_in_threadpool(_find_grievance, tracking_id)
    except Exception as e:
        logger.error(f"Error fetching grievance status for {tracking_id}: {str(e)}")
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Failed to fetch grievance status")
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No grievance with tracking ID {tracking_id}")
    return {
        "tracking_id": row["tracking_id"],
        "status": row["status"],
        "pillar": row["pillar"],
        "submitted_at": row["created_at"],
    }


@router.get("/ping")
async def ping():
    return {"router": "grievance", "status": "online"}
