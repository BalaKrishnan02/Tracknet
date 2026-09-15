from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class HourlyTrafficSchema(BaseModel):
    hour: str
    count: int
    cars: int
    bikes: int
    buses: int
    trucks: int

class LocationTrafficSchema(BaseModel):
    camera_id: int
    camera_code: str
    camera_name: str
    location: str
    latitude: float
    longitude: float
    vehicle_count: int
    congestion_level: str  # Low, Medium, High, Critical
    avg_speed: float

class ODRouteSchema(BaseModel):
    origin: str
    destination: str
    count: int
    avg_duration_mins: float

class TrafficAnalyticsResponse(BaseModel):
    total_vehicles_today: int
    vehicle_counts_by_type: Dict[str, int]
    traffic_by_location: List[LocationTrafficSchema]
    hourly_trend: List[HourlyTrafficSchema]
    peak_traffic_hour: str
    busiest_origin: str
    busiest_destination: str
    od_matrix: List[ODRouteSchema]
    congestion_distribution: Dict[str, int]
