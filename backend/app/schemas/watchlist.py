from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WatchlistBase(BaseModel):
    plate_number: str
    reason: str
    priority: str = "High"  # Low, Medium, High, Critical
    status: str = "Active"  # Active, Inactive

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistResponse(WatchlistBase):
    id: int
    added_by: str
    created_at: datetime

    class Config:
        from_attributes = True
