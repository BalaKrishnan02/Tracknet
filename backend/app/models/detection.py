from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class VehicleDetection(Base):
    __tablename__ = "vehicle_detections"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("camera_videos.id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    
    # Plate Data
    plate_number = Column(String(20), index=True, nullable=False)  # Normalized: TN31AB4589
    raw_ocr_text = Column(String(30), nullable=True)               # e.g. TN 31 AB 4589 or TN31A84589
    ocr_confidence = Column(Float, default=0.95)
    plate_confidence = Column(Float, default=0.95)                 # Detection box confidence
    
    # Vehicle Data
    vehicle_type = Column(String(30), default="Car")               # Car, Bike, Bus, Truck, Auto, SUV
    vehicle_confidence = Column(Float, default=0.92)
    vehicle_color = Column(String(30), default="White")
    direction = Column(String(20), default="Northbound")
    estimated_speed = Column(Float, default=45.0)                  # km/h
    
    # Frame and Video Timing
    frame_number = Column(Integer, nullable=True)
    video_timestamp_seconds = Column(Float, default=0.0)
    absolute_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True) # Backward compatibility
    
    # Location Metadata (Copied from video/camera for high speed GIS queries)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(150), nullable=True)
    
    # Visual Assets
    vehicle_image = Column(String(255), nullable=True)
    plate_image = Column(String(255), nullable=True)
    processed_plate_image_path = Column(String(255), nullable=True)
    validation_score = Column(Float, default=1.0)
    match_status = Column(String(30), default="DETECTED")          # DETECTED, CONFIRMED, REJECTED, PROBABLE

    # Relationships
    camera = relationship("Camera")
    camera_video = relationship("CameraVideo", back_populates="detections")
