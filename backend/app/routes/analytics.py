from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.camera import Camera
from app.models.detection import VehicleDetection
from app.models.traffic import TrafficStatistic
from app.schemas.traffic import TrafficAnalyticsResponse
from app.ai.traffic_analyzer import calculate_congestion_level

router = APIRouter(prefix="/analytics", tags=["Traffic Analytics"])

@router.get("/traffic", response_model=TrafficAnalyticsResponse)
def get_traffic_analytics(db: Session = Depends(get_db)):
    total_vehicles = db.query(VehicleDetection).count()
    
    # Vehicle Counts By Type
    types_query = (
        db.query(VehicleDetection.vehicle_type, func.count(VehicleDetection.id))
        .group_by(VehicleDetection.vehicle_type)
        .all()
    )
    by_type = {"Car": 0, "Bike": 0, "Bus": 0, "Truck": 0, "Auto": 0, "Others": 0}
    for vtype, count in types_query:
        if vtype in by_type:
            by_type[vtype] = count
        else:
            by_type["Others"] += count

    # Location-wise breakdown
    cameras = db.query(Camera).all()
    traffic_by_location = []
    congestions = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    
    for c in cameras:
        v_count = db.query(VehicleDetection).filter(VehicleDetection.camera_id == c.id).count()
        cong = calculate_congestion_level(int(v_count / 6))
        congestions[cong] = congestions.get(cong, 0) + 1
        
        traffic_by_location.append({
            "camera_id": c.id,
            "camera_code": c.camera_code,
            "camera_name": c.name,
            "location": c.location,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "vehicle_count": v_count,
            "congestion_level": cong,
            "avg_speed": 46.5
        })

    # Hourly Trend
    hourly_stats = db.query(TrafficStatistic).order_by(TrafficStatistic.hour.asc()).all()
    hour_dict = {}
    for h in range(7, 20):
        hour_dict[f"{h:02d}:00"] = {"count": 0, "cars": 0, "bikes": 0, "buses": 0, "trucks": 0}

    for s in hourly_stats:
        h_str = f"{s.hour:02d}:00"
        if h_str in hour_dict:
            hour_dict[h_str]["count"] += s.total_count
            hour_dict[h_str]["cars"] += s.car_count
            hour_dict[h_str]["bikes"] += s.bike_count
            hour_dict[h_str]["buses"] += s.bus_count
            hour_dict[h_str]["trucks"] += s.truck_count

    hourly_trend = []
    peak_count = 0
    peak_hour = "09:00 AM"
    for h_str, data in hour_dict.items():
        hourly_trend.append({
            "hour": h_str,
            "count": data["count"],
            "cars": data["cars"],
            "bikes": data["bikes"],
            "buses": data["buses"],
            "trucks": data["trucks"]
        })
        if data["count"] > peak_count:
            peak_count = data["count"]
            peak_hour = h_str

    # OD Matrix (Origin - Destination matrix)
    od_matrix = [
        {"origin": "Railway Station", "destination": "Bus Stand", "count": 142, "avg_duration_mins": 7.2},
        {"origin": "Bus Stand", "destination": "Main Road", "count": 198, "avg_duration_mins": 11.5},
        {"origin": "Main Road", "destination": "Airport Road", "count": 114, "avg_duration_mins": 16.8},
        {"origin": "Railway Station", "destination": "Airport Road", "count": 86, "avg_duration_mins": 25.4},
        {"origin": "College Road", "destination": "Main Road", "count": 73, "avg_duration_mins": 9.1},
        {"origin": "Bus Stand", "destination": "College Road", "count": 64, "avg_duration_mins": 8.4},
    ]

    return {
        "total_vehicles_today": total_vehicles,
        "vehicle_counts_by_type": by_type,
        "traffic_by_location": traffic_by_location,
        "hourly_trend": hourly_trend,
        "peak_traffic_hour": peak_hour,
        "busiest_origin": "Bus Stand Junction",
        "busiest_destination": "Main Road (Gandhi Junction)",
        "od_matrix": od_matrix,
        "congestion_distribution": congestions
    }

@router.get("/cameras")
def get_cameras_analytics(db: Session = Depends(get_db)):
    return get_traffic_analytics(db)

@router.get("/routes")
def get_route_analytics(db: Session = Depends(get_db)):
    return get_traffic_analytics(db)

@router.get("/origin-destination")
def get_od_analytics(db: Session = Depends(get_db)):
    res = get_traffic_analytics(db)
    return res["od_matrix"]
