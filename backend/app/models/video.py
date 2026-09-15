from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class CameraVideo(Base):
    __tablename__ = "camera_videos"

    id = Column(Integer, primary_key=True, index=True)
    video_name = Column(String(120), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    
    # Location & Camera Metadata
    camera_code = Column(String(30), default="CAM01")
    camera_name = Column(String(120), default="Traffic Camera")
    state = Column(String(60), default="Puducherry")
    city = Column(String(60), default="Puducherry")
    zone = Column(String(60), default="Boulevard Town")
    location_name = Column(String(150), default="City Junction")
    latitude = Column(Float, default=11.9425)
    longitude = Column(Float, default=79.8250)
    road_name = Column(String(120), default="Main Arterial Road")
    direction = Column(String(40), default="Northbound")
    
    # Timing Metadata
    video_date = Column(String(20), default="2026-09-09")      # YYYY-MM-DD
    video_start_time = Column(String(20), default="09:00:00")  # HH:MM:SS
    
    # Video Properties
    duration_seconds = Column(Float, default=0.0)
    fps = Column(Float, default=30.0)
    width = Column(Integer, default=1920)
    height = Column(Integer, default=1080)
    
    # Analysis Status & Pipeline Progress
    analysis_status = Column(String(30), default="UPLOADED")   # UPLOADED, QUEUED, ANALYZING, COMPLETED, FAILED
    analysis_progress = Column(Float, default=0.0)             # 0 - 100%
    total_frames = Column(Integer, default=0)
    processed_frames = Column(Integer, default=0)
    detections_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    camera = relationship("Camera", backref="videos")
    detections = relationship("VehicleDetection", back_populates="camera_video", cascade="all, delete-orphan")
