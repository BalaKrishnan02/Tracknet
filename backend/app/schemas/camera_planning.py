from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CameraRecommendationItem(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    road_type: str
    location_type: str
    placement_score: float
    priority: str
    recommended_direction: str
    lanes: int
    traffic_level: str
    estimated_daily_volume: int
    reasons: List[str]

class CityAnalysisRequest(BaseModel):
    state: str
    city: str
    zone: Optional[str] = None

class CityAnalysisResponse(BaseModel):
    city: str
    state: str
    existing_camera_count: int
    active_camera_count: int
    proposed_camera_count: int
    coverage_gaps: int
    coverage_score: float
    coverage_status: str
    recommended_camera_count: int
    congestion_hotspots: List[str]
    recommendations: List[CameraRecommendationItem]

class ProposeCameraRequest(BaseModel):
    location_name: str
    city: str
    state: str
    zone: Optional[str] = "Central Zone"
    latitude: float
    longitude: float
    road_type: str = "ARTERIAL_ROAD"
    location_type: str = "MAJOR_JUNCTION"
    placement_score: float = 85.0
    priority: str = "HIGH"
    placement_reason: str = "Surveillance coverage gap identified at critical traffic intersection"
    lanes_covered: int = 4
    direction: str = "Inbound + Outbound"
    estimated_daily_volume: int = 25000
    traffic_level: str = "High"
