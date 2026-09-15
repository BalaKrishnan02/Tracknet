from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from datetime import datetime
from app.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_code = Column(String(50), unique=True, index=True, nullable=False)  # IND-TN-CHN-CAM001 or CAM01
    name = Column(String(120), nullable=False)                                 # Camera Name / Title
    
    # Hierarchy
    country = Column(String(50), default="India", index=True)
    state = Column(String(80), default="Tamil Nadu", index=True)
    district = Column(String(80), nullable=True)
    city = Column(String(80), default="Chennai", index=True)
    zone = Column(String(80), default="Central Zone", index=True)
    
    # Precise Road & Placement Details
    location = Column(String(150), nullable=False)                             # Backward-compatible alias for location
    location_name = Column(String(150), nullable=True)
    road_name = Column(String(120), nullable=True)
    road_type = Column(String(50), default="ARTERIAL_ROAD")                    # NATIONAL_HIGHWAY, STATE_HIGHWAY, ARTERIAL_ROAD, etc.
    location_type = Column(String(50), default="MAJOR_JUNCTION")               # CITY_ENTRY, MAJOR_JUNCTION, TOLL_APPROACH, etc.
    
    # Spatial & Coverage
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    direction = Column(String(50), default="Inbound + Outbound")
    lanes_covered = Column(Integer, default=4)
    
    # Operational Status
    status = Column(String(30), default="Active", index=True)                  # Active, Offline, Maintenance, Proposed
    camera_source = Column(String(50), default="DEMO_VIDEO")                   # DEMO_VIDEO, UPLOADED_VIDEO, RTSP_CAMERA, etc.
    stream_url = Column(String(255), nullable=True)
    installation_type = Column(String(50), default="Gantry Mount")             # Pole, Gantry Mount, Cantilever, Overpass
    
    # Placement Analysis Scores
    placement_score = Column(Float, default=85.0)                              # 0 - 100
    placement_priority = Column(String(30), default="HIGH")                    # LOW, MEDIUM, HIGH, CRITICAL
    placement_reason = Column(Text, nullable=True)
    
    # Traffic Profile
    traffic_level = Column(String(30), default="Medium")                       # Low, Medium, High, Critical
    estimated_daily_volume = Column(Integer, default=24000)
    coverage_status = Column(String(30), default="Covered")                    # Covered, Gap, Proposed
    is_proposed = Column(Boolean, default=False, index=True)
    
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
