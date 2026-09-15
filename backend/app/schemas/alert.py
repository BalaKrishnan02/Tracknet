from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    detection_id: Optional[int] = None
    plate_number: str
    alert_type: str = "Watchlist Hit"
    priority: str = "High"
    message: str
    status: str = "Unreviewed"

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    created_at: datetime
    camera_name: Optional[str] = None
    location: Optional[str] = None
    detection_time: Optional[datetime] = None
    vehicle_image: Optional[str] = None

    class Config:
        from_attributes = True
