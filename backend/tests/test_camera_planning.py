import pytest
from app.services.camera_placement_engine import calculate_placement_score, classify_priority
from app.services.camera_coverage_service import classify_coverage

def test_camera_placement_scoring():
    # Test high-importance location (National highway toll approach with high volume)
    res_high = calculate_placement_score({
        "estimated_daily_volume": 42000,
        "location_type": "TOLL_APPROACH",
        "road_type": "NATIONAL_HIGHWAY",
        "traffic_level": "High",
        "coverage_status": "Gap"
    })

    assert 0 <= res_high["placement_score"] <= 100
    assert res_high["priority"] in ["HIGH", "CRITICAL"]
    assert len(res_high["reasons"]) > 0
    assert res_high["recommended_lanes"] >= 2

def test_camera_placement_low_priority():
    # Low volume local road without congestion
    res_low = calculate_placement_score({
        "estimated_daily_volume": 8000,
        "location_type": "OTHER",
        "road_type": "LOCAL_STREET",
        "traffic_level": "Low",
        "coverage_status": "Covered"
    })
    assert res_low["placement_score"] < 60
    assert res_low["priority"] in ["LOW", "MEDIUM"]

def test_priority_and_coverage_classifications():
    assert classify_priority(92.5) == "CRITICAL"
    assert classify_priority(72.0) == "HIGH"
    assert classify_priority(48.0) == "MEDIUM"
    assert classify_priority(25.0) == "LOW"

    assert classify_coverage(85.0) == "GOOD COVERAGE"
    assert classify_coverage(62.0) == "MODERATE COVERAGE"
    assert classify_coverage(42.0) == "LOW COVERAGE"
    assert classify_coverage(18.0) == "CRITICAL COVERAGE GAP"
