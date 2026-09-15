from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CameraBase(BaseModel):
    camera_code: str
    name: str
    location: str
    latitude: float
    longitude: float
    status: str = "Online"
    stream_url: Optional[str] = None

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    stream_url: Optional[str] = None

class CameraResponse(CameraBase):
    id: int
    created_at: datetime
    vehicle_count_today: Optional[int] = 0
    last_detection: Optional[str] = None

    class Config:
        from_attributes = True
