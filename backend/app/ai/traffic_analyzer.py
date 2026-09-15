"""
Traffic Analyzer & Congestion Scoring Module
Categorizes traffic density:
0-30 = LOW
31-60 = MEDIUM
61-100 = HIGH
Above 100 = CRITICAL
"""
from typing import Dict, Any, List

CONGESTION_THRESHOLDS = {
    "LOW": (0, 30),
    "MEDIUM": (31, 60),
    "HIGH": (61, 100),
    "CRITICAL": (101, 99999)
}

def calculate_congestion_level(vehicle_count_per_hour: int) -> str:
    """
    Computes qualitative traffic congestion level.
    """
    if vehicle_count_per_hour <= 30:
        return "Low"
    elif vehicle_count_per_hour <= 60:
        return "Medium"
    elif vehicle_count_per_hour <= 100:
        return "High"
    else:
        return "Critical"

def aggregate_traffic_metrics(detections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregates vehicle counts by category, location, and speed averages.
    """
    by_type = {"Car": 0, "Bike": 0, "Bus": 0, "Truck": 0, "Auto": 0, "Others": 0}
    total_speed = 0.0
    count = len(detections)

    for d in detections:
        vtype = d.get("vehicle_type", "Car")
        if vtype in by_type:
            by_type[vtype] += 1
        else:
            by_type["Others"] += 1
        total_speed += d.get("estimated_speed", 45.0)

    avg_speed = round(total_speed / count, 1) if count > 0 else 45.0

    return {
        "total_vehicles": count,
        "vehicle_breakdown": by_type,
        "average_speed_kmh": avg_speed,
        "overall_congestion": calculate_congestion_level(count)
    }
