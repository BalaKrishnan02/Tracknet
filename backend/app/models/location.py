from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)  # e.g., TN, KA, MH, DL
    name = Column(String(100), unique=True, nullable=False)            # e.g., Tamil Nadu
    country = Column(String(50), default="India")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    cities = relationship("City", back_populates="state_rel", cascade="all, delete-orphan")

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)  # e.g., CHN, BLR, DEL
    name = Column(String(100), index=True, nullable=False)             # e.g., Chennai
    tier = Column(String(20), default="Tier-1")                        # Tier-1, Tier-2, State Capital
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    state_rel = relationship("State", back_populates="cities")
    zones = relationship("Zone", back_populates="city_rel", cascade="all, delete-orphan")

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    code = Column(String(30), nullable=False)                          # e.g., CHN-NZ, CHN-SZ
    name = Column(String(100), nullable=False)                         # e.g., North Zone, Central Business District
    coverage_score = Column(Float, default=70.0)

    city_rel = relationship("City", back_populates="zones")
