from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("vehicle_detections.id"), nullable=True)
    plate_number = Column(String(20), index=True, nullable=False)
    alert_type = Column(String(50), default="Watchlist Hit")  # Watchlist Hit, Route Anomaly, Speed Violation
    priority = Column(String(20), default="High")  # Low, Medium, High, Critical
    message = Column(String(255), nullable=False)
    status = Column(String(20), default="Unreviewed")  # Unreviewed, Reviewed, Dismissed
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    detection = relationship("VehicleDetection")
