from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class TrafficStatistic(Base):
    __tablename__ = "traffic_statistics"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    hour = Column(Integer, nullable=False)  # 0-23
    car_count = Column(Integer, default=0)
    bike_count = Column(Integer, default=0)
    bus_count = Column(Integer, default=0)
    truck_count = Column(Integer, default=0)
    other_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    average_speed = Column(Float, default=45.0)
    congestion_level = Column(String(20), default="Low")  # Low, Medium, High, Critical

    camera = relationship("Camera")
