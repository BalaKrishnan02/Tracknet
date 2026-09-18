from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.detection import VehicleDetection
from app.models.video import CameraVideo
from app.models.camera import Camera
from app.models.watchlist import Watchlist
from app.services.plate_normalizer import normalize_plate, clean_ocr_for_display
from app.services.plate_matcher import classify_match
from app.services.video_timestamp_service import format_video_time_str
from app.services.trajectory_service import build_vehicle_trajectory

router = APIRouter(prefix="/vehicle-search", tags=["Multi-Camera Vehicle Search & Matching"])

class VehicleSearchRequest(BaseModel):
    plate_number: str
    include_probable_matches: bool = True
    search_scope: str = "ALL"  # "ALL" or "SELECTED"
    camera_ids: Optional[List[int]] = None
    date_filter: Optional[str] = None

class MatchReviewRequest(BaseModel):
    detection_id: int
    decision: str  # "CONFIRM" or "REJECT"
    notes: Optional[str] = None

@router.post("")
def search_all_camera_videos(req: VehicleSearchRequest, db: Session = Depends(get_db)):
    """
    Searches target plate across all uploaded camera videos.
    Finds exact and probable matches, orders sightings chronologically,
    and returns multi-camera detection results with trajectory and camera status summary.
    """
    target = normalize_plate(req.plate_number)
    if not target:
        raise HTTPException(status_code=400, detail="Please enter a valid number plate.")

    # Base query for detections
    q = db.query(VehicleDetection)

    # Optional camera filter
    if req.search_scope == "SELECTED" and req.camera_ids:
        q = q.filter(VehicleDetection.camera_id.in_(req.camera_ids))

    candidate_dets = q.all()

    matched_results = []
    exact_count = 0
    probable_count = 0

    for d in candidate_dets:
        det_plate = normalize_plate(d.plate_number)
        raw_ocr = normalize_plate(d.raw_ocr_text) if d.raw_ocr_text else det_plate

        # If raw OCR differs from target, evaluate against raw OCR to surface typo tolerance
        if raw_ocr and raw_ocr != target:
            eval_result = classify_match(
                target_plate=target,
                detected_plate=raw_ocr,
                ocr_confidence=d.ocr_confidence or 0.88
            )
        else:
            eval_result = classify_match(
                target_plate=target,
                detected_plate=det_plate,
                ocr_confidence=d.ocr_confidence or 0.95
            )

        # If user only wanted exact matches
        if not req.include_probable_matches and eval_result["match_type"] != "EXACT MATCH":
            continue

        if eval_result["is_match"]:
            if eval_result["match_type"] == "EXACT MATCH":
                exact_count += 1
            else:
                probable_count += 1

            # Resolve camera and video details
            cam = d.camera
            vid = d.camera_video

            cam_code = (vid.camera_code if vid else None) or (cam.camera_code if cam else "CAM")
            cam_name = (vid.camera_name if vid else None) or (cam.name if cam else "Camera")
            loc_name = (vid.location_name if vid else None) or (cam.location if cam else "Intersection")
            city = (vid.city if vid else None) or (cam.city if cam else "Smart City Node")
            lat = (d.latitude or (vid.latitude if vid else None) or (cam.latitude if cam else 11.9425))
            lon = (d.longitude or (vid.longitude if vid else None) or (cam.longitude if cam else 79.8250))
            vid_name = vid.video_name if vid else "camera_stream.mp4"
            vid_path = vid.file_path if vid else ""

            v_sec = float(d.video_timestamp_seconds or 0.0)
            # 5 seconds pre-roll for automatic video jump
            jump_sec = max(0.0, v_sec - 5.0)

            # Safely resolve timestamp — absolute_timestamp may be None on old seed records
            abs_dt = d.absolute_timestamp or d.timestamp or datetime.utcnow()

            matched_results.append({
                "id": d.id,
                "plate_number": d.plate_number,
                "raw_ocr_text": d.raw_ocr_text or d.plate_number,
                "target_plate": target,
                "match_type": eval_result["match_type"],
                "plate_similarity": eval_result["plate_similarity"],
                "match_confidence": eval_result["match_confidence"],
                "ocr_confidence": round(float(d.ocr_confidence or 0.95) * 100, 1),
                "camera_id": d.camera_id,
                "camera_code": cam_code,
                "camera_name": cam_name,
                "location_name": loc_name,
                "city": city,
                "latitude": lat,
                "longitude": lon,
                "video_id": d.video_id,
                "video_name": vid_name,
                "video_file_path": vid_path,
                "frame_number": d.frame_number or int(v_sec * 30),
                "video_timestamp_seconds": v_sec,
                "video_timestamp_str": format_video_time_str(v_sec),
                "jump_timestamp_seconds": jump_sec,
                "absolute_timestamp": abs_dt,
                "detection_time_str": abs_dt.strftime("%H:%M:%S") if isinstance(abs_dt, datetime) else str(abs_dt),
                "vehicle_type": d.vehicle_type or "Car",
                "vehicle_color": d.vehicle_color or "White",
                "estimated_speed": d.estimated_speed or 45.0,
                "plate_image": d.plate_image or f"/static/plates/{target.lower()}_crop.jpg",
                "vehicle_image": d.vehicle_image or "/static/vehicles/car_white.jpg",
                "processed_plate_image_path": d.processed_plate_image_path or d.plate_image,
                "match_status": d.match_status or "DETECTED",
                "requires_review": eval_result["requires_review"]
            })

    # Sort strictly chronologically by absolute_timestamp ASC
    # Use a safe sort key — convert to isoformat string-comparable value if it's a datetime
    matched_results.sort(key=lambda x: x["absolute_timestamp"] if isinstance(x["absolute_timestamp"], str) else (x["absolute_timestamp"].isoformat() if x["absolute_timestamp"] else ""))

    # Unique cameras found
    unique_cams = list(set(m["camera_code"] for m in matched_results))

    # All available video camera codes for summary
    all_videos = db.query(CameraVideo).all()
    all_cam_codes = sorted(list(set(v.camera_code for v in all_videos if v.camera_code)))
    if not all_cam_codes:
        all_cam_codes = ["CAM01", "CAM02", "CAM03", "CAM04", "CAM05"]

    # Trajectory reconstruction
    trajectory_data = build_vehicle_trajectory(target, matched_results, all_cam_codes)

    # Check Watchlist status
    wl = db.query(Watchlist).filter(
        Watchlist.plate_number == target,
        Watchlist.status == "Active"
    ).first()

    first_seen_str = matched_results[0]["detection_time_str"] if matched_results else None
    last_seen_str = matched_results[-1]["detection_time_str"] if matched_results else None

    # Convert datetime objects to ISO strings for JSON serialization
    serialized_detections = []
    for m in matched_results:
        m_copy = dict(m)
        if isinstance(m_copy.get("absolute_timestamp"), datetime):
            m_copy["absolute_timestamp"] = m_copy["absolute_timestamp"].isoformat()
        serialized_detections.append(m_copy)

    if trajectory_data.get("waypoints"):
        for w in trajectory_data["waypoints"]:
            if isinstance(w.get("absolute_timestamp"), datetime):
                w["absolute_timestamp"] = w["absolute_timestamp"].isoformat()

    return {
        "target_plate": target,
        "formatted_target_plate": clean_ocr_for_display(target),
        "total_matches": len(matched_results),
        "exact_matches": exact_count,
        "probable_matches": probable_count,
        "camera_count": len(unique_cams),
        "cameras_found": unique_cams,
        "first_seen": first_seen_str,
        "last_seen": last_seen_str,
        "is_watchlisted": wl is not None,
        "watchlist_reason": wl.reason if wl else None,
        "camera_summary": trajectory_data["camera_summary"],
        "detections": serialized_detections,
        "trajectory": trajectory_data
    }

@router.post("/confirm-match")
def review_match_decision(req: MatchReviewRequest, db: Session = Depends(get_db)):
    """Operator manually confirms or rejects a probable ANPR match."""
    det = db.query(VehicleDetection).filter(VehicleDetection.id == req.detection_id).first()
    if not det:
        raise HTTPException(status_code=404, detail="Detection record not found")

    if req.decision.upper() == "CONFIRM":
        det.match_status = "CONFIRMED"
        msg = "Match successfully confirmed by operator."
    else:
        det.match_status = "REJECTED"
        msg = "Match rejected by operator."

    db.commit()
    return {"status": "Success", "detection_id": det.id, "match_status": det.match_status, "message": msg}

@router.get("/detection/{detection_id}")
def get_detection_details(detection_id: int, db: Session = Depends(get_db)):
    """Returns all spatiotemporal, vehicle, and visual crop fields for a single detection."""
    d = db.query(VehicleDetection).filter(VehicleDetection.id == detection_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Detection not found")

    cam = d.camera
    vid = d.camera_video
    v_sec = float(d.video_timestamp_seconds or 0.0)

    return {
        "id": d.id,
        "plate_number": d.plate_number,
        "raw_ocr_text": d.raw_ocr_text or d.plate_number,
        "normalized_plate": normalize_plate(d.plate_number),
        "ocr_confidence": d.ocr_confidence,
        "plate_confidence": d.plate_confidence,
        "vehicle_type": d.vehicle_type,
        "vehicle_color": d.vehicle_color,
        "vehicle_confidence": d.vehicle_confidence,
        "estimated_speed": d.estimated_speed,
        "direction": d.direction,
        "frame_number": d.frame_number,
        "video_timestamp_seconds": v_sec,
        "video_timestamp_str": format_video_time_str(v_sec),
        "jump_timestamp_seconds": max(0.0, v_sec - 5.0),
        "absolute_timestamp": d.absolute_timestamp.isoformat() if d.absolute_timestamp else None,
        "camera_code": (vid.camera_code if vid else None) or (cam.camera_code if cam else "CAM01"),
        "camera_name": (vid.camera_name if vid else None) or (cam.name if cam else "Camera"),
        "location_name": (vid.location_name if vid else None) or (cam.location if cam else "Location"),
        "city": (vid.city if vid else None) or (cam.city if cam else "Puducherry"),
        "state": (vid.state if vid else None) or (cam.state if cam else "Puducherry"),
        "latitude": d.latitude or (cam.latitude if cam else 11.9425),
        "longitude": d.longitude or (cam.longitude if cam else 79.8250),
        "video_id": d.video_id,
        "video_name": vid.video_name if vid else "camera.mp4",
        "video_url": f"/uploads/videos/{vid.video_name}" if vid else None,
        "plate_image": d.plate_image,
        "vehicle_image": d.vehicle_image,
        "processed_plate_image_path": d.processed_plate_image_path or d.plate_image,
        "match_status": d.match_status,
        "created_at": d.timestamp.isoformat() if d.timestamp else None
    }
