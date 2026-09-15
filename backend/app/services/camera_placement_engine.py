"""
Camera Placement Recommendation Engine
Calculates multi-factor Camera Placement Score (0 - 100) and provides
transparent, explainable recommendations for optimal ANPR camera deployments.
"""
from typing import Dict, Any, List, Optional

# Default weights conforming to SIH Problem Statement specifications
DEFAULT_WEIGHTS = {
    "traffic_volume": 0.25,
    "junction_importance": 0.15,
    "city_entry_exit": 0.15,
    "highway_connectivity": 0.10,
    "congestion_level": 0.10,
    "accident_blackspot": 0.10,
    "public_transport": 0.05,
    "freight_industrial": 0.05,
    "coverage_gap": 0.05,
}

PRIORITY_THRESHOLDS = {
    "CRITICAL": 80,
    "HIGH": 60,
    "MEDIUM": 40,
    "LOW": 0
}

LOCATION_TYPE_MAPPINGS = {
    "CITY_ENTRY": {"entry_exit": 1.0, "highway": 0.8, "lanes": 4, "direction": "Inbound"},
    "CITY_EXIT": {"entry_exit": 1.0, "highway": 0.8, "lanes": 4, "direction": "Outbound"},
    "MAJOR_JUNCTION": {"junction": 1.0, "lanes": 4, "direction": "Multi-Directional (All Arms)"},
    "NATIONAL_HIGHWAY": {"highway": 1.0, "volume": 0.9, "lanes": 6, "direction": "Both Inbound + Outbound"},
    "STATE_HIGHWAY": {"highway": 0.8, "volume": 0.75, "lanes": 4, "direction": "Both Inbound + Outbound"},
    "RING_ROAD": {"highway": 0.8, "volume": 0.85, "lanes": 6, "direction": "Orbital (Clockwise / Counter)"},
    "BYPASS": {"highway": 0.8, "lanes": 4, "direction": "Both Directions"},
    "FLYOVER": {"junction": 0.8, "lanes": 4, "direction": "Both Elevated Decks"},
    "BRIDGE": {"chokepoint": 0.9, "junction": 0.7, "lanes": 4, "direction": "Both Directions"},
    "TOLL_APPROACH": {"entry_exit": 1.0, "highway": 0.9, "junction": 0.8, "lanes": 8, "direction": "Approach Toll Plazas"},
    "AIRPORT_ROAD": {"public_transport": 0.9, "lanes": 4, "direction": "Inbound + Outbound"},
    "RAILWAY_STATION_ROAD": {"public_transport": 1.0, "junction": 0.7, "lanes": 4, "direction": "Circulating Approach"},
    "BUS_TERMINAL_ROAD": {"public_transport": 1.0, "junction": 0.7, "lanes": 4, "direction": "Bus Terminal Entry / Exit"},
    "INDUSTRIAL_CORRIDOR": {"freight": 0.9, "lanes": 4, "direction": "Freight Route Bi-directional"},
    "LOGISTICS_CORRIDOR": {"freight": 1.0, "highway": 0.8, "lanes": 6, "direction": "Heavy Vehicle Corridor"},
    "COMMERCIAL_AREA": {"volume": 0.8, "congestion": 0.8, "lanes": 2, "direction": "Commercial Corridor"},
    "TRAFFIC_BLACKSPOT": {"accident": 1.0, "lanes": 4, "direction": "Hazardous Zone Monitoring"},
    "CONGESTION_HOTSPOT": {"congestion": 1.0, "junction": 0.8, "lanes": 4, "direction": "Gridlock Feeder Roads"},
    "ARTERIAL_ROAD": {"volume": 0.7, "lanes": 4, "direction": "Both Directions"},
    "OTHER": {"volume": 0.5, "lanes": 2, "direction": "Single Direction"}
}

def classify_priority(score: float) -> str:
    if score >= PRIORITY_THRESHOLDS["CRITICAL"]:
        return "CRITICAL"
    elif score >= PRIORITY_THRESHOLDS["HIGH"]:
        return "HIGH"
    elif score >= PRIORITY_THRESHOLDS["MEDIUM"]:
        return "MEDIUM"
    else:
        return "LOW"

def calculate_placement_score(
    location_data: Dict[str, Any],
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Computes Camera Placement Score (0-100) and transparent recommendation reasons.
    """
    w = weights or DEFAULT_WEIGHTS
    loc_type = str(location_data.get("location_type", "OTHER")).upper()
    road_type = str(location_data.get("road_type", "ARTERIAL_ROAD")).upper()
    
    # Volume factor
    vol_val = location_data.get("estimated_daily_volume", 20000)
    vol_factor = min(1.0, vol_val / 40000.0)

    # Junction importance
    if "JUNCTION" in loc_type or "FLYOVER" in loc_type or "INTERSECT" in loc_type or "BRIDGE" in loc_type or "TOLL" in loc_type or location_data.get("is_major_junction", False):
        junc_factor = 0.9 if "TOLL" in loc_type or "BRIDGE" in loc_type else 1.0
    else:
        junc_factor = 0.2 if "ARTERIAL" in road_type else 0.0

    # City Entry/Exit importance
    if "ENTRY" in loc_type or "EXIT" in loc_type or "TOLL" in loc_type or "BORDER" in loc_type or location_data.get("is_city_entry_exit", False):
        entry_exit_factor = 1.0
    elif "BYPASS" in loc_type or "RING_ROAD" in loc_type:
        entry_exit_factor = 0.7
    else:
        entry_exit_factor = 0.0

    # Highway connectivity
    if "NATIONAL_HIGHWAY" in road_type or "NATIONAL_HIGHWAY" in loc_type:
        highway_factor = 1.0
    elif "STATE_HIGHWAY" in road_type or "STATE_HIGHWAY" in loc_type or "RING_ROAD" in road_type or "BYPASS" in loc_type or "EXPRESSWAY" in loc_type:
        highway_factor = 0.8
    elif "ARTERIAL" in road_type:
        highway_factor = 0.4
    else:
        highway_factor = 0.0

    # Congestion level
    cong_str = str(location_data.get("traffic_level", "Medium")).lower()
    cong_factor = 1.0 if "critical" in cong_str else (0.75 if "high" in cong_str else (0.5 if "medium" in cong_str else 0.25))

    # Accident / Blackspot
    accident_factor = 1.0 if (location_data.get("is_blackspot", False) or "BLACKSPOT" in loc_type) else 0.0

    # Public Transport Hubs
    pt_factor = 1.0 if (location_data.get("is_transit_hub", False) or any(t in loc_type for t in ["AIRPORT", "RAILWAY", "BUS_TERMINAL"])) else 0.0

    # Freight / Logistics Corridors
    freight_factor = 1.0 if any(f in loc_type for f in ["INDUSTRIAL", "LOGISTICS"]) else (0.5 if "HIGHWAY" in road_type else 0.0)

    # Coverage gap
    coverage_gap_factor = 1.0 if (location_data.get("coverage_status", "Gap") == "Gap") else 0.0

    score = (
        (vol_factor * w["traffic_volume"]) +
        (junc_factor * w["junction_importance"]) +
        (entry_exit_factor * w["city_entry_exit"]) +
        (highway_factor * w["highway_connectivity"]) +
        (cong_factor * w["congestion_level"]) +
        (accident_factor * w["accident_blackspot"]) +
        (pt_factor * w["public_transport"]) +
        (freight_factor * w["freight_industrial"]) +
        (coverage_gap_factor * w["coverage_gap"])
    ) * 100.0

    score = round(min(100.0, max(0.0, score)), 1)
    priority = classify_priority(score)

    # Generate transparent explanations
    reasons = []
    if vol_factor >= 0.65:
        reasons.append("High estimated traffic volume (> 30,000 vehicles/day)")
    if junc_factor >= 0.7:
        reasons.append("Critical urban intersection connecting major arterial corridors")
    if entry_exit_factor >= 0.7:
        reasons.append("Strategic city perimeter entry/exit gateway for inter-district tracking")
    if highway_factor >= 0.8:
        reasons.append("National / State Highway corridor carrying long-haul transit")
    if cong_factor >= 0.75:
        reasons.append(f"Severe peak-hour congestion hotspot ({location_data.get('traffic_level', 'High')} density)")
    if accident_factor:
        reasons.append("Designated traffic blackspot with historical collision density")
    if pt_factor:
        reasons.append("Major transit hub feeder road (Railway Station / Bus Terminus / Airport)")
    if freight_factor >= 0.8:
        reasons.append("Heavy commercial logistics & freight movement corridor")
    if coverage_gap_factor:
        reasons.append("Existing surveillance coverage gap identified in current camera grid")

    if not reasons:
        reasons.append("General urban arterial traffic surveillance and regulation")

    type_meta = LOCATION_TYPE_MAPPINGS.get(loc_type, LOCATION_TYPE_MAPPINGS["OTHER"])

    return {
        "placement_score": score,
        "priority": priority,
        "reasons": reasons,
        "recommended_direction": type_meta.get("direction", "Inbound + Outbound"),
        "recommended_lanes": location_data.get("lanes", type_meta.get("lanes", 4)),
        "road_type": road_type,
        "location_type": loc_type
    }
