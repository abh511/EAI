"""
EnviroWatch AI  —  FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from fastapi.concurrency import run_in_threadpool

from app.core.config import settings
from app.services import load_data
from app.api.routes import auth, dashboard, alerts, forecast, locations, grievance, simulation, site_analysis, ml_predictions

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting (data source: {settings.DATA_SOURCE})...")
    # Load readings up front so the first request isn't slow (the database load takes ~10 s)
    await run_in_threadpool(load_data)
    yield
    logger.info("🛑 Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered environmental risk detection & prediction system for Indian cities",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api/auth",          tags=["Auth"])
app.include_router(locations.router,     prefix="/api/locations",     tags=["Locations"])
app.include_router(dashboard.router,     prefix="/api/dashboard",     tags=["Dashboard"])
app.include_router(alerts.router,        prefix="/api/alerts",        tags=["Alerts"])
app.include_router(forecast.router,      prefix="/api/forecast",      tags=["Forecast"])
app.include_router(grievance.router,     prefix="/api/grievance",     tags=["Grievance"])
app.include_router(simulation.router,    prefix="/api/simulation",    tags=["Simulation"])
app.include_router(site_analysis.router, prefix="/api/site-analysis", tags=["Site Analysis"])
app.include_router(ml_predictions.router, prefix="/api/ml",           tags=["Machine Learning"])

@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
    }

@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "healthy", "service": settings.APP_NAME}
