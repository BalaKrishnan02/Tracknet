from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DetectionBase(BaseModel):
    plate_number: str
    raw_ocr_text: Optional[str] = None
    ocr_confidence: float = 0.95
    camera_id: int
    vehicle_type: str = "Car"
    vehicle_color: str = "White"
    direction: str = "Northbound"
    estimated_speed: float = 45.0
    timestamp: Optional[datetime] = None
    vehicle_image: Optional[str] = None
    plate_image: Optional[str] = None
    validation_score: float = 1.0

class DetectionCreate(DetectionBase):
    pass

class DetectionResponse(DetectionBase):
    id: int
    camera_code: Optional[str] = None
    camera_name: Optional[str] = None
    camera_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True
