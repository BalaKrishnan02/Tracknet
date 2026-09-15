import pytest
from datetime import datetime, timedelta
from app.ai.plate_validator import normalize_plate_text, validate_indian_plate
from app.ai.plate_matcher import weighted_levenshtein_similarity, match_plates
from app.ai.trajectory_engine import haversine_distance, compute_spatiotemporal_feasibility, reconstruct_trajectory
from app.ai.traffic_analyzer import calculate_congestion_level
from app.utils.security import get_password_hash, verify_password

def test_plate_normalization():
    assert normalize_plate_text("tn 31 ab 4589") == "TN31AB4589"
    assert normalize_plate_text("py-01-az-1234") == "PY01AZ1234"
    assert normalize_plate_text("dl.01.c.9876") == "DL01C9876"

def test_indian_plate_validation():
    is_valid, score, meta = validate_indian_plate("TN31AB4589")
    assert is_valid is True
    assert score == 1.0
    assert meta["state"] == "TN"
    assert meta["rto"] == "31"

    # Test BH series
    is_valid_bh, score_bh, meta_bh = validate_indian_plate("22BH1234AA")
    assert is_valid_bh is True
    assert meta_bh["series"] == "BH"

def test_ocr_typo_fuzzy_matching():
    # 'TN31AB4589' vs OCR typo 'TN31A84589' (8 for B)
    p1 = "TN31AB4589"
    p2 = "TN31A84589"
    sim = weighted_levenshtein_similarity(p1, p2)
    assert sim >= 0.85

    status, conf, breakdown = match_plates(p1, p2, query_type="Car", target_type="Car")
    assert status in ["Probable Match", "Exact Match"]
    assert conf >= 0.80

def test_haversine_and_trajectory():
    # Distance between Pondicherry Railway Station and Bus Stand approx 1.0 - 1.5 km
    lat1, lon1 = 11.9360, 79.8300
    lat2, lon2 = 11.9425, 79.8250
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    assert 0.8 <= dist <= 2.0

    t1 = datetime(2026, 9, 9, 9, 10, 0)
    t2 = datetime(2026, 9, 9, 9, 17, 0)
    d_km, speed, feas = compute_spatiotemporal_feasibility(lat1, lon1, t1, lat2, lon2, t2)
    assert d_km > 0
    assert speed > 0
    assert feas >= 0.85

def test_traffic_congestion_levels():
    assert calculate_congestion_level(15) == "Low"
    assert calculate_congestion_level(45) == "Medium"
    assert calculate_congestion_level(85) == "High"
    assert calculate_congestion_level(120) == "Critical"

def test_security_password_hashing():
    pw = "Admin@123"
    hashed = get_password_hash(pw)
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
