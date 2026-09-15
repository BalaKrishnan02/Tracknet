import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.camera import Camera
from app.models.location import City, State
from app.schemas.camera_planning import (
    CityAnalysisRequest, CityAnalysisResponse, CameraRecommendationItem,
    ProposeCameraRequest
)
from app.services.camera_placement_engine import calculate_placement_score, classify_priority
from app.services.camera_coverage_service import analyze_city_coverage

router = APIRouter(prefix="/camera-placement", tags=["Camera Placement Planning"])

# 20 Strategic Urban Road Categories for ANPR Planning
CITY_CANDIDATE_TEMPLATES = [
    {"name": "{city} Northern Entry Toll Plaza", "loc_type": "CITY_ENTRY", "road_type": "NATIONAL_HIGHWAY", "lanes": 6, "vol": 46000, "traffic": "High"},
    {"name": "{city} Southern Expressway Exit", "loc_type": "CITY_EXIT", "road_type": "NATIONAL_HIGHWAY", "lanes": 6, "vol": 44000, "traffic": "High"},
    {"name": "{city} Central Junction Flyover Deck", "loc_type": "MAJOR_JUNCTION", "road_type": "FLYOVER", "lanes": 4, "vol": 48000, "traffic": "Critical"},
    {"name": "{city} Outer Ring Road Phase 2 Intersect", "loc_type": "RING_ROAD", "road_type": "RING_ROAD", "lanes": 6, "vol": 42000, "traffic": "High"},
    {"name": "{city} High-Density Traffic Blackspot #1", "loc_type": "TRAFFIC_BLACKSPOT", "road_type": "STATE_HIGHWAY", "lanes": 4, "vol": 36000, "traffic": "Critical"},
    {"name": "{city} Inter-State Logistics Freight Terminal", "loc_type": "LOGISTICS_CORRIDOR", "road_type": "STATE_HIGHWAY", "lanes": 4, "vol": 32000, "traffic": "Medium"},
    {"name": "{city} Airport Terminal Approach Expressway", "loc_type": "AIRPORT_ROAD", "road_type": "NATIONAL_HIGHWAY", "lanes": 6, "vol": 38000, "traffic": "High"},
    {"name": "{city} Central Railway Junction East Approach", "loc_type": "RAILWAY_STATION_ROAD", "road_type": "ARTERIAL_ROAD", "lanes": 4, "vol": 34000, "traffic": "Critical"},
    {"name": "{city} Heavy Industrial Hub Feeder Corridor", "loc_type": "INDUSTRIAL_CORRIDOR", "road_type": "ARTERIAL_ROAD", "lanes": 4, "vol": 29000, "traffic": "Medium"},
    {"name": "{city} Major River Bridge Bottleneck", "loc_type": "BRIDGE", "road_type": "ARTERIAL_ROAD", "lanes": 4, "vol": 41000, "traffic": "Critical"},
]

@router.post("/analyze", response_model=CityAnalysisResponse)
def analyze_city_placement(req: CityAnalysisRequest, db: Session = Depends(get_db)):
    city_obj = db.query(City).filter(City.name == req.city).first()
    
    # Fallback coordinate if city not yet in DB
    base_lat = city_obj.latitude if city_obj else 13.0827
    base_lon = city_obj.longitude if city_obj else 80.2707

    coverage_info = analyze_city_coverage(db, req.city)
    existing_cams = db.query(Camera).filter(Camera.city == req.city).all()

    existing_loc_names = {c.location_name for c in existing_cams if c.location_name}

    recommendations = []
    hotspots = []

    for idx, tmpl in enumerate(CITY_CANDIDATE_TEMPLATES):
        loc_name = tmpl["name"].format(city=req.city)
        if loc_name in existing_loc_names:
            continue

        # Offset candidate GPS coordinates by ~1-3 km around city center
        c_lat = round(base_lat + (0.018 * (idx % 4 - 1.5)), 5)
        c_lon = round(base_lon + (0.018 * (idx % 3 - 1.0)), 5)

        score_data = calculate_placement_score({
            "estimated_daily_volume": tmpl["vol"],
            "location_type": tmpl["loc_type"],
            "road_type": tmpl["road_type"],
            "traffic_level": tmpl["traffic"],
            "coverage_status": "Gap"
        })

        if tmpl["traffic"] == "Critical":
            hotspots.append(loc_name)

        recommendations.append(CameraRecommendationItem(
            location_name=loc_name,
            latitude=c_lat,
            longitude=c_lon,
            road_type=tmpl["road_type"],
            location_type=tmpl["loc_type"],
            placement_score=score_data["placement_score"],
            priority=score_data["priority"],
            recommended_direction=score_data["recommended_direction"],
            lanes=score_data["recommended_lanes"],
            traffic_level=tmpl["traffic"],
            estimated_daily_volume=tmpl["vol"],
            reasons=score_data["reasons"]
        ))

    # Sort recommendations by placement score descending
    recommendations.sort(key=lambda r: r.placement_score, reverse=True)

    return CityAnalysisResponse(
        city=req.city,
        state=req.state,
        existing_camera_count=coverage_info["existing_cameras"],
        active_camera_count=coverage_info["active_cameras"],
        proposed_camera_count=coverage_info["proposed_cameras"],
        coverage_gaps=coverage_info["coverage_gaps"],
        coverage_score=coverage_info["coverage_score"],
        coverage_status=coverage_info["status_label"],
        recommended_camera_count=len(recommendations),
        congestion_hotspots=hotspots,
        recommendations=recommendations[:6]  # Return top 6 highest priority recommendations
    )

@router.post("/propose")
def propose_camera(req: ProposeCameraRequest, db: Session = Depends(get_db)):
    # Generate unique camera code: e.g. IND-PROP-CHN-###
    city_prefix = req.city[:3].upper()
    existing_count = db.query(Camera).filter(Camera.city == req.city).count()
    cam_code = f"IND-PROP-{city_prefix}-CAM{existing_count + 1:03d}"

    cam = Camera(
        camera_code=cam_code,
        name=f"{req.location_name} (PROPOSED ANPR CAMERA)",
        country="India",
        state=req.state,
        district=req.city,
        city=req.city,
        zone=req.zone or "Central Zone",
        location=req.location_name,
        location_name=req.location_name,
        road_name=f"{req.city} {req.road_type.replace('_', ' ').title()}",
        road_type=req.road_type,
        location_type=req.location_type,
        latitude=req.latitude,
        longitude=req.longitude,
        direction=req.direction,
        lanes_covered=req.lanes_covered,
        status="Proposed",
        camera_source="DEMO_VIDEO",
        stream_url=f"/static/feeds/{cam_code.lower()}_proposed.mp4",
        installation_type="Proposed Gantry Mount",
        placement_score=req.placement_score,
        placement_priority=req.priority,
        placement_reason=req.placement_reason,
        traffic_level=req.traffic_level,
        estimated_daily_volume=req.estimated_daily_volume,
        coverage_status="Proposed",
        is_proposed=True
    )
    db.add(cam)
    db.commit()
    db.refresh(cam)

    return {
        "status": "Success",
        "message": f"Successfully proposed new ANPR camera {cam_code} at {req.location_name}",
        "camera_id": cam.id,
        "camera_code": cam.camera_code
    }

@router.post("/{camera_id}/activate")
def activate_proposed_camera(camera_id: int, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")

    cam.status = "Active"
    cam.is_proposed = False
    cam.coverage_status = "Covered"
    db.commit()

    return {
        "status": "Success",
        "message": f"Camera {cam.camera_code} successfully transitioned from Proposed to Active state.",
        "camera_code": cam.camera_code,
        "new_status": cam.status
    }
