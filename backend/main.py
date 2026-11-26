from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Prevent Windows AppData\Roaming\Ultralytics permission errors
if "YOLO_CONFIG_DIR" not in os.environ:
    cfg = Path(__file__).resolve().parent.parent / "ai_module" / ".ultralytics"
    if not cfg.parent.exists():
        cfg = Path(__file__).resolve().parent / ".ultralytics"
    cfg.mkdir(parents=True, exist_ok=True)
    os.environ["YOLO_CONFIG_DIR"] = str(cfg)

from app.database import engine, Base
from app.routers import auth, videos, detections, map_router, issues, reports, dashboard, traffic

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    # Create upload directories
    os.makedirs("uploads/videos", exist_ok=True)
    os.makedirs("uploads/frames", exist_ok=True)
    yield

app = FastAPI(
    title="Urban Eye API",
    description="Smart Urban Road & Traffic Intelligence System API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
app.include_router(detections.router, prefix="/api/detections", tags=["Detections"])
app.include_router(map_router.router, prefix="/api/map", tags=["Map"])
app.include_router(issues.router, prefix="/api/issues", tags=["Issues"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(traffic.router, prefix="/api/traffic", tags=["Traffic"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "Urban Eye API", "version": "1.0.0"}
