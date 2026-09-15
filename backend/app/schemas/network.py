from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ZoneSchema(BaseModel):
    id: int
    code: str
    name: str
    coverage_score: float

    class Config:
        from_attributes = True

class CitySchema(BaseModel):
    id: int
    code: str
    name: str
    tier: str
    latitude: float
    longitude: float
    total_cameras: Optional[int] = 0
    active_cameras: Optional[int] = 0
    proposed_cameras: Optional[int] = 0

    class Config:
        from_attributes = True

class StateSchema(BaseModel):
    id: int
    code: str
    name: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_cities: Optional[int] = 0
    total_cameras: Optional[int] = 0
    active_cameras: Optional[int] = 0
    proposed_cameras: Optional[int] = 0
    offline_cameras: Optional[int] = 0
    coverage_score: Optional[float] = 0.0

    class Config:
        from_attributes = True

class IndiaNetworkSummary(BaseModel):
    total_registered_cameras: int
    active_anpr_cameras: int
    offline_cameras: int
    maintenance_cameras: int
    proposed_cameras: int
    states_covered: int
    cities_covered: int
    high_traffic_cameras: int
    critical_traffic_cameras: int
    total_vehicles_today: int
    average_network_health: str
    state_breakdown: List[StateSchema]

class CameraMapItemSchema(BaseModel):
    id: int
    camera_code: str
    name: str
    state: str
    city: str
    zone: str
    location: str
    road_name: Optional[str] = None
    road_type: str
    location_type: str
    latitude: float
    longitude: float
    status: str
    traffic_level: str
    placement_score: float
    placement_priority: str
    placement_reason: Optional[str] = None
    is_proposed: bool
    estimated_daily_volume: int
    lanes_covered: int
    direction: str

    class Config:
        from_attributes = True

class CityRankingSchema(BaseModel):
    rank: int
    city: str
    state: str
    total_cameras: int
    active_cameras: int
    traffic_volume: int
    congestion_level: str
    coverage_score: float
    priority: str
