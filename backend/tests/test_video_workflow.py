import pytest
from app.services.plate_normalizer import normalize_plate, clean_ocr_for_display
from app.services.plate_matcher import compute_plate_similarity, classify_match
from app.services.video_timestamp_service import parse_start_datetime, compute_absolute_timestamp
from datetime import datetime, timedelta

def test_plate_normalizer():
    assert normalize_plate("tn 31 ab 4589") == "TN31AB4589"
    assert normalize_plate("TN-31-AB-4589") == "TN31AB4589"
    assert normalize_plate("py.01.az.1234") == "PY01AZ1234"

def test_ocr_typo_matcher_tolerance():
    target = "TN31AB4589"
    # Typo where '8' is mistaken for 'B'
    typo_sighting = "TN31A84589"
    
    sim = compute_plate_similarity(target, typo_sighting)
    assert sim >= 85.0
    
    classification = classify_match(target, typo_sighting, ocr_confidence=0.88)
    assert classification["match_type"] == "PROBABLE MATCH"
    assert classification["is_match"] is True

def test_video_timestamp_calculation():
    start_dt = parse_start_datetime("2026-09-09", "09:00:00")
    assert start_dt.hour == 9
    assert start_dt.minute == 0
    
    # 5 minutes and 32 seconds into the video (332.0 seconds)
    abs_time = compute_absolute_timestamp(start_dt, 332.0)
    assert abs_time.strftime("%H:%M:%S") == "09:05:32"
