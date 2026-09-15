import asyncio
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.services.demo_data_generator import seed_demo_database
from app.services.india_demo_generator import seed_india_network
from app.services.live_feed_simulator import start_live_feed_simulation
from app.websocket.manager import manager

# Import routers
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.cameras import router as cameras_router
from app.routes.detections import router as detections_router
from app.routes.vehicles import router as vehicles_router
from app.routes.analytics import router as analytics_router
from app.routes.alerts import router as alerts_router
from app.routes.watchlist import router as watchlist_router
from app.routes.video import router as video_router
from app.routes.videos import router as videos_router
from app.routes.vehicle_search import router as vehicle_search_router
from app.routes.network import router as network_router
from app.routes.camera_planning import router as camera_planning_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("traffitrace.main")

background_tasks = set()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    logger.info("Initializing TraffiTrace AI Database Tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        logger.info("Checking and seeding SIH Hackathon Demo Dataset...")
        seed_demo_database(db)
        logger.info("Seeding India-Wide ANPR Camera Network and City Hierarchy...")
        seed_india_network(db)
    finally:
        db.close()

    # Start live feed simulator in background
    sim_task = asyncio.create_task(start_live_feed_simulation())
    background_tasks.add(sim_task)
    sim_task.add_done_callback(background_tasks.discard)

    yield

    # Shutdown: Cancel background simulation
    logger.info("Shutting down background tasks...")
    for task in background_tasks:
        task.cancel()

app = FastAPI(
    title="TrackNet - AI-Powered Vehicle Tracking & Traffic Analytics",
    description="Full-stack AI platform for Smart India Hackathon 2026 (Problem Statement 26127)",
    version="1.2.0",
    lifespan=lifespan
)

# CORS Configuration
cors_origins = list(settings.BACKEND_CORS_ORIGINS)
for o in ["https://tracknet-seven.vercel.app", "http://localhost:5173", "http://localhost:3000"]:
    if o not in cors_origins:
        cors_origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "vehicles"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "plates"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "feeds"), exist_ok=True)

uploads_dir = os.path.abspath("uploads")
os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "videos"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "plates"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "vehicles"), exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Mount API Routers
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(cameras_router, prefix=api_prefix)
app.include_router(detections_router, prefix=api_prefix)
app.include_router(vehicles_router, prefix=api_prefix)
app.include_router(videos_router, prefix=api_prefix)
app.include_router(vehicle_search_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(alerts_router, prefix=api_prefix)
app.include_router(watchlist_router, prefix=api_prefix)
app.include_router(video_router, prefix=api_prefix)
app.include_router(network_router, prefix=api_prefix)
app.include_router(camera_planning_router, prefix=api_prefix)

@app.websocket("/ws/live-detections")
async def websocket_live_detections(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "project": "TrackNet AI",
        "tagline": "Track Today | Transform Tomorrow",
        "hackathon": "Smart India Hackathon 2026",
        "problem_statement_id": "26127",
        "module": "AI-Powered Vehicle Tracking & City Traffic Analytics",
        "status": "Operational",
        "demo_mode": settings.DEMO_MODE,
        "docs_url": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "online",
        "app": "TrackNet AI ANPR Platform",
        "version": "1.2.0",
        "database": db_status,
        "database_type": "postgresql" if str(settings.DATABASE_URL).startswith("postgres") else "sqlite",
        "cors_origins": list(settings.BACKEND_CORS_ORIGINS),
        "server_time": datetime.utcnow().isoformat()
    }

