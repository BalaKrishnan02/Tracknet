from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models.camera import Camera
from app.models.location import State, City, Zone
from app.schemas.network import (
    IndiaNetworkSummary, StateSchema, CitySchema, ZoneSchema,
    CameraMapItemSchema, CityRankingSchema
)
from app.services.camera_coverage_service import analyze_city_coverage
from app.services.camera_placement_engine import calculate_placement_score

router = APIRouter(prefix="/network", tags=["India ANPR Network"])

@router.get("/india/summary", response_model=IndiaNetworkSummary)
def get_india_summary(db: Session = Depends(get_db)):
    total_cameras = db.query(Camera).count()
    active_anpr = db.query(Camera).filter(Camera.status.in_(["Active", "Online"])).count()
    offline_cams = db.query(Camera).filter(Camera.status == "Offline").count()
    maintenance_cams = db.query(Camera).filter(Camera.status.in_(["Maintenance", "Warning"])).count()
    proposed_cams = db.query(Camera).filter(Camera.status == "Proposed").count()

    states = db.query(State).all()
    states_count = len(states)
    cities_count = db.query(City).count()

    high_traffic = db.query(Camera).filter(Camera.traffic_level == "High").count()
    critical_traffic = db.query(Camera).filter(Camera.traffic_level == "Critical").count()

    state_breakdown = []
    for s in states:
        c_count = db.query(Camera).filter(Camera.state == s.name).count()
        act_count = db.query(Camera).filter(Camera.state == s.name, Camera.status.in_(["Active", "Online"])).count()
        prop_count = db.query(Camera).filter(Camera.state == s.name, Camera.status == "Proposed").count()
        off_count = db.query(Camera).filter(Camera.state == s.name, Camera.status == "Offline").count()
        cities_in_s = db.query(City).filter(City.state_id == s.id).count()
        cov_score = round((act_count / max(1, c_count)) * 100.0, 1)

        state_breakdown.append(StateSchema(
            id=s.id,
            code=s.code,
            name=s.name,
            country=s.country,
            latitude=s.latitude,
            longitude=s.longitude,
            total_cities=cities_in_s,
            total_cameras=c_count,
            active_cameras=act_count,
            proposed_cameras=prop_count,
            offline_cameras=off_count,
            coverage_score=cov_score
        ))

    return {
        "total_registered_cameras": total_cameras,
        "active_anpr_cameras": active_anpr,
        "offline_cameras": offline_cams,
        "maintenance_cameras": maintenance_cams,
        "proposed_cameras": proposed_cams,
        "states_covered": states_count,
        "cities_covered": cities_count,
        "high_traffic_cameras": high_traffic,
        "critical_traffic_cameras": critical_traffic,
        "total_vehicles_today": 348200,
        "average_network_health": "98.4% Operational (DEMO / SIMULATED DATA)",
        "state_breakdown": state_breakdown
    }

@router.get("/states", response_model=List[StateSchema])
def get_states(db: Session = Depends(get_db)):
    states = db.query(State).all()
    results = []
    for s in states:
        c_count = db.query(Camera).filter(Camera.state == s.name).count()
        act_count = db.query(Camera).filter(Camera.state == s.name, Camera.status.in_(["Active", "Online"])).count()
        prop_count = db.query(Camera).filter(Camera.state == s.name, Camera.status == "Proposed").count()
        off_count = db.query(Camera).filter(Camera.state == s.name, Camera.status == "Offline").count()
        cities_in_s = db.query(City).filter(City.state_id == s.id).count()
        cov_score = round((act_count / max(1, c_count)) * 100.0, 1)

        results.append(StateSchema(
            id=s.id,
            code=s.code,
            name=s.name,
            country=s.country,
            latitude=s.latitude,
            longitude=s.longitude,
            total_cities=cities_in_s,
            total_cameras=c_count,
            active_cameras=act_count,
            proposed_cameras=prop_count,
            offline_cameras=off_count,
            coverage_score=cov_score
        ))
    return results

@router.get("/states/{state_id}", response_model=StateSchema)
def get_state_detail(state_id: int, db: Session = Depends(get_db)):
    s = db.query(State).filter(State.id == state_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="State not found")

    c_count = db.query(Camera).filter(Camera.state == s.name).count()
    act_count = db.query(Camera).filter(Camera.state == s.name, Camera.status.in_(["Active", "Online"])).count()
    prop_count = db.query(Camera).filter(Camera.state == s.name, Camera.status == "Proposed").count()
    off_count = db.query(Camera).filter(Camera.state == s.name, Camera.status == "Offline").count()
    cities_in_s = db.query(City).filter(City.state_id == s.id).count()
    cov_score = round((act_count / max(1, c_count)) * 100.0, 1)

    return StateSchema(
        id=s.id,
        code=s.code,
        name=s.name,
        country=s.country,
        latitude=s.latitude,
        longitude=s.longitude,
        total_cities=cities_in_s,
        total_cameras=c_count,
        active_cameras=act_count,
        proposed_cameras=prop_count,
        offline_cameras=off_count,
        coverage_score=cov_score
    )

@router.get("/states/{state_id}/cities", response_model=List[CitySchema])
def get_state_cities(state_id: int, db: Session = Depends(get_db)):
    cities = db.query(City).filter(City.state_id == state_id).all()
    results = []
    for c in cities:
        c_count = db.query(Camera).filter(Camera.city == c.name).count()
        act_count = db.query(Camera).filter(Camera.city == c.name, Camera.status.in_(["Active", "Online"])).count()
        prop_count = db.query(Camera).filter(Camera.city == c.name, Camera.status == "Proposed").count()

        results.append(CitySchema(
            id=c.id,
            code=c.code,
            name=c.name,
            tier=c.tier,
            latitude=c.latitude,
            longitude=c.longitude,
            total_cameras=c_count,
            active_cameras=act_count,
            proposed_cameras=prop_count
        ))
    return results

@router.get("/cities/{city_id}", response_model=CitySchema)
def get_city_detail(city_id: int, db: Session = Depends(get_db)):
    c = db.query(City).filter(City.id == city_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="City not found")

    c_count = db.query(Camera).filter(Camera.city == c.name).count()
    act_count = db.query(Camera).filter(Camera.city == c.name, Camera.status.in_(["Active", "Online"])).count()
    prop_count = db.query(Camera).filter(Camera.city == c.name, Camera.status == "Proposed").count()

    return CitySchema(
        id=c.id,
        code=c.code,
        name=c.name,
        tier=c.tier,
        latitude=c.latitude,
        longitude=c.longitude,
        total_cameras=c_count,
        active_cameras=act_count,
        proposed_cameras=prop_count
    )

@router.get("/cities/{city_id}/zones", response_model=List[ZoneSchema])
def get_city_zones(city_id: int, db: Session = Depends(get_db)):
    zones = db.query(Zone).filter(Zone.city_id == city_id).all()
    return zones

@router.get("/cities/{city_id}/cameras", response_model=List[CameraMapItemSchema])
def get_city_cameras(city_id: int, db: Session = Depends(get_db)):
    c = db.query(City).filter(City.id == city_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="City not found")

    cameras = db.query(Camera).filter(Camera.city == c.name).all()
    return cameras

@router.get("/cities/{city_id}/coverage")
def get_city_coverage(city_id: int, db: Session = Depends(get_db)):
    c = db.query(City).filter(City.id == city_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="City not found")
    return analyze_city_coverage(db, c.name)

@router.get("/cameras/active", response_model=List[CameraMapItemSchema])
def get_active_cameras(
    state: Optional[str] = None,
    city: Optional[str] = None,
    zone: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    query = db.query(Camera).filter(Camera.status.in_(["Active", "Online"]))
    if state:
        query = query.filter(Camera.state == state)
    if city:
        query = query.filter(Camera.city == city)
    if zone:
        query = query.filter(Camera.zone == zone)
    return query.limit(limit).all()

@router.get("/cameras/offline", response_model=List[CameraMapItemSchema])
def get_offline_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).filter(Camera.status == "Offline").all()

@router.get("/cameras/proposed", response_model=List[CameraMapItemSchema])
def get_proposed_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).filter(Camera.status == "Proposed").all()

@router.get("/cameras/map", response_model=List[CameraMapItemSchema])
def get_cameras_map(
    north: Optional[float] = None,
    south: Optional[float] = None,
    east: Optional[float] = None,
    west: Optional[float] = None,
    zoom: Optional[int] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    location_type: Optional[str] = None,
    traffic_level: Optional[str] = None,
    limit: int = 500,
    db: Session = Depends(get_db)
):
    query = db.query(Camera)
    if state and state != "All":
        query = query.filter(Camera.state == state)
    if city and city != "All":
        query = query.filter(Camera.city == city)
    if status and status != "All":
        query = query.filter(Camera.status == status)
    if location_type and location_type != "All":
        query = query.filter(Camera.location_type == location_type)
    if traffic_level and traffic_level != "All":
        query = query.filter(Camera.traffic_level == traffic_level)

    # Bounding box filters when specified
    if north is not None and south is not None:
        query = query.filter(Camera.latitude <= north, Camera.latitude >= south)
    if east is not None and west is not None:
        query = query.filter(Camera.longitude <= east, Camera.longitude >= west)

    return query.limit(limit).all()

@router.get("/coverage-gaps")
def get_all_coverage_gaps(db: Session = Depends(get_db)):
    # Cameras flagged as proposed or gap locations
    gaps = db.query(Camera).filter(Camera.status.in_(["Proposed", "Offline"])).all()
    results = []
    for g in gaps:
        results.append({
            "camera_code": g.camera_code,
            "city": g.city,
            "state": g.state,
            "location": g.location,
            "road_type": g.road_type,
            "latitude": g.latitude,
            "longitude": g.longitude,
            "placement_score": g.placement_score,
            "placement_priority": g.placement_priority,
            "reasons": g.placement_reason
        })
    return results

@router.get("/traffic-hotspots")
def get_traffic_hotspots(db: Session = Depends(get_db)):
    hotspots = db.query(Camera).filter(Camera.traffic_level.in_(["Critical", "High"])).all()
    return hotspots

@router.get("/cities/ranking", response_model=List[CityRankingSchema])
def get_city_rankings(db: Session = Depends(get_db)):
    cities = db.query(City).all()
    rankings = []

    for idx, c in enumerate(cities):
        cameras = db.query(Camera).filter(Camera.city == c.name).all()
        c_count = len(cameras)
        act_count = sum(1 for cam in cameras if cam.status in ["Active", "Online"])
        vol = sum(cam.estimated_daily_volume or 20000 for cam in cameras)
        crit_count = sum(1 for cam in cameras if cam.traffic_level == "Critical")
        cong_label = "Critical" if crit_count >= 2 else ("High" if vol > 180000 else "Medium")
        cov_score = round((act_count / max(1, c_count)) * 100.0, 1)

        priority = "High Priority" if cov_score < 70 or cong_label == "Critical" else "Adequate Coverage"

        rankings.append({
            "rank": idx + 1,
            "city": c.name,
            "state": c.state_rel.name if c.state_rel else "India",
            "total_cameras": c_count,
            "active_cameras": act_count,
            "traffic_volume": vol,
            "congestion_level": cong_label,
            "coverage_score": cov_score,
            "priority": priority
        })

    # Sort by traffic volume descending
    rankings.sort(key=lambda r: r["traffic_volume"], reverse=True)
    for i, r in enumerate(rankings):
        r["rank"] = i + 1

    return rankings
