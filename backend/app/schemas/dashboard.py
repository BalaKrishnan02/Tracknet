from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.schemas.camera import CameraResponse
from app.schemas.detection import DetectionResponse
from app.schemas.alert import AlertResponse

class DashboardSummary(BaseModel):
    # Enriched Active ANPR Camera metrics
    total_registered_cameras: int
    active_anpr_cameras: int
    offline_cameras: int
    maintenance_cameras: int
    proposed_cameras: int
    states_covered: int
    cities_covered: int
    high_traffic_cameras: int
    critical_traffic_cameras: int

    # Existing backward-compatible fields
    total_vehicles_today: int
    active_cameras: int
    total_cameras: int
    total_alerts: int
    unread_alerts: int
    avg_traffic_level: str  # Low, Medium, High, Critical
    vehicles_per_hour: int
    most_congested_area: str
    camera_status_counts: Dict[str, int]
    recent_detections: List[DetectionResponse]
    recent_alerts: List[AlertResponse]
    traffic_level_breakdown: Dict[str, int]
