from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(20), unique=True, index=True, nullable=False)
    reason = Column(String(255), nullable=False)  # Demo Security Watchlist / Stolen / Traffic Violation
    priority = Column(String(20), default="High")  # Low, Medium, High, Critical
    status = Column(String(20), default="Active")  # Active, Inactive
    added_by = Column(String(100), default="Admin")
    created_at = Column(DateTime, default=datetime.utcnow)
