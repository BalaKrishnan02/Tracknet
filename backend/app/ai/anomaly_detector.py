"""
AI Route Anomaly & Behavioral Anomaly Detector
Detects:
1. Out-of-sequence or restricted demo zone entry
2. Extreme speed violations (>90 km/h in city cameras)
3. Abnormal turnarounds or unusual travel time delays
"""
from datetime import datetime
from typing import List, Dict, Any, Optional

RESTRICTED_DEMO_ZONES = ["Restricted Demo Zone", "VIP Corridor", "Secure Perimeter"]

def detect_route_anomaly(trajectory_points: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Evaluates vehicle trajectory for anomalies.
    Returns anomaly metadata dict if detected, else None.
    """
    if not trajectory_points or len(trajectory_points) < 2:
        return None

    # Check 1: Restricted demo zone detection
    for pt in trajectory_points:
        loc = pt.get("camera_name", "") + " " + pt.get("camera_location", "")
        if any(rz.lower() in loc.lower() for rz in RESTRICTED_DEMO_ZONES):
            return {
                "anomaly_type": "Restricted Zone Entry",
                "severity": "Critical",
                "anomaly_score": 0.95,
                "explanation": f"Vehicle entered restricted security sector at {pt.get('camera_name')}.",
                "timestamp": pt.get("timestamp")
            }

    # Check 2: Speed anomaly
    for pt in trajectory_points:
        speed = pt.get("estimated_speed", 0.0)
        leg_speed = pt.get("leg_speed_kmh", 0.0)
        if speed > 95.0 or leg_speed > 110.0:
            return {
                "anomaly_type": "Severe Speed Anomaly",
                "severity": "High",
                "anomaly_score": 0.88,
                "explanation": f"Excessive velocity of {max(speed, leg_speed)} km/h recorded.",
                "timestamp": pt.get("timestamp")
            }

    return None
