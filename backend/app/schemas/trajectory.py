from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TrajectoryPointSchema(BaseModel):
    id: Optional[int] = None
    sequence_number: int
    detection_id: int
    camera_code: str
    camera_name: str
    camera_location: Optional[str] = None
    city: Optional[str] = None
    latitude: float
    longitude: float
    timestamp: datetime
    plate_number: str
    raw_ocr_text: Optional[str] = None
    ocr_confidence: float
    vehicle_type: str
    vehicle_color: str
    estimated_speed: float
    vehicle_image: Optional[str] = None
    match_score: float = 1.0
    match_type: str = "Exact Match"  # Exact Match / Probable Match

    class Config:
        from_attributes = True

class TrajectoryReconstructionResponse(BaseModel):
    plate_number: str
    vehicle_type: str
    vehicle_color: str
    city: Optional[str] = None
    first_seen: datetime
    last_seen: datetime
    total_detections: int
    start_camera: str
    end_camera: str
    journey_duration_minutes: float
    estimated_distance_km: float
    estimated_avg_speed_kmh: float
    overall_confidence: float
    match_status: str  # Exact Match, Probable Match, Needs Review
    points: List[TrajectoryPointSchema]
    is_watchlisted: bool = False
    watchlist_reason: Optional[str] = None
