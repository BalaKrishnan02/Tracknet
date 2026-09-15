from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Trajectory(Base):
    __tablename__ = "trajectories"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(20), index=True, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    start_camera = Column(String(100), nullable=False)
    end_camera = Column(String(100), nullable=False)
    distance = Column(Float, default=0.0)  # km
    average_speed = Column(Float, default=0.0)  # km/h
    confidence = Column(Float, default=1.0)
    match_type = Column(String(30), default="Exact Match")  # Exact Match, Probable Match, Needs Review
    created_at = Column(DateTime, default=datetime.utcnow)

    points = relationship("TrajectoryPoint", back_populates="trajectory", cascade="all, delete-orphan")

class TrajectoryPoint(Base):
    __tablename__ = "trajectory_points"

    id = Column(Integer, primary_key=True, index=True)
    trajectory_id = Column(Integer, ForeignKey("trajectories.id"), nullable=False)
    detection_id = Column(Integer, ForeignKey("vehicle_detections.id"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    camera_code = Column(String(50), nullable=True)
    camera_name = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    match_score = Column(Float, default=1.0)

    trajectory = relationship("Trajectory", back_populates="points")
    detection = relationship("VehicleDetection")
