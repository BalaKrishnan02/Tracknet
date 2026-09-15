"""
City Camera Coverage Analysis Service
Analyzes municipal camera coverage density, flags surveillance blindspots,
and calculates coverage efficiency scores.
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.camera import Camera

def classify_coverage(score: float) -> str:
    if score >= 75.0:
        return "GOOD COVERAGE"
    elif score >= 50.0:
        return "MODERATE COVERAGE"
    elif score >= 30.0:
        return "LOW COVERAGE"
    else:
        return "CRITICAL COVERAGE GAP"

def analyze_city_coverage(db: Session, city_name: str) -> Dict[str, Any]:
    """
    Computes camera coverage score, gaps, and priority locations for a specific city.
    """
    cameras = db.query(Camera).filter(Camera.city == city_name).all()
    
    total_existing = len(cameras)
    active_count = sum(1 for c in cameras if c.status == "Active" or c.status == "Online")
    proposed_count = sum(1 for c in cameras if c.status == "Proposed" or c.is_proposed)
    offline_count = sum(1 for c in cameras if c.status == "Offline")

    # High-priority locations are junctions, entry/exit points, highways, chokepoints
    priority_cameras = [c for c in cameras if c.location_type in ["CITY_ENTRY", "CITY_EXIT", "MAJOR_JUNCTION", "NATIONAL_HIGHWAY", "TOLL_APPROACH", "TRAFFIC_BLACKSPOT"]]
    covered_priority = sum(1 for c in priority_cameras if c.status in ["Active", "Online"])

    # Estimated priority points needed for full city coverage based on city tier/cameras
    total_priority_needed = max(total_existing + 8, int(total_existing * 1.35))
    coverage_gaps = max(0, total_priority_needed - covered_priority)

    coverage_score = round((covered_priority / max(1, total_priority_needed)) * 100.0, 1)
    status_label = classify_coverage(coverage_score)

    # Zone breakdown
    zone_stats = {}
    for c in cameras:
        z_name = c.zone or "Central Zone"
        if z_name not in zone_stats:
            zone_stats[z_name] = {
                "zone_name": z_name,
                "total_cameras": 0,
                "active_cameras": 0,
                "proposed_cameras": 0,
                "offline_cameras": 0,
                "traffic_volume": 0
            }
        zone_stats[z_name]["total_cameras"] += 1
        if c.status in ["Active", "Online"]:
            zone_stats[z_name]["active_cameras"] += 1
        elif c.status == "Proposed" or c.is_proposed:
            zone_stats[z_name]["proposed_cameras"] += 1
        else:
            zone_stats[z_name]["offline_cameras"] += 1
        zone_stats[z_name]["traffic_volume"] += c.estimated_daily_volume or 20000

    return {
        "city": city_name,
        "total_priority_locations": total_priority_needed,
        "existing_cameras": total_existing,
        "covered_priority_locations": covered_priority,
        "active_cameras": active_count,
        "proposed_cameras": proposed_count,
        "offline_cameras": offline_count,
        "coverage_gaps": coverage_gaps,
        "coverage_score": coverage_score,
        "status_label": status_label,
        "zones": list(zone_stats.values())
    }
