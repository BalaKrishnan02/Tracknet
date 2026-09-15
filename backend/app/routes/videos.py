import os
import shutil
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.video import CameraVideo
from app.models.camera import Camera
from app.models.detection import VehicleDetection
from app.services.video_analysis_service import trigger_video_analysis, ACTIVE_ANALYSIS_TASKS
from app.services.frame_processor import UploadedVideoSource

logger = logging.getLogger("traffitrace.routes.videos")

router = APIRouter(prefix="/videos", tags=["Video Management & ANPR Analysis"])

UPLOAD_VIDEOS_DIR = os.path.join("uploads", "videos")
os.makedirs(UPLOAD_VIDEOS_DIR, exist_ok=True)

@router.post("/upload")
async def upload_camera_video(
    file: UploadFile = File(...),
    camera_id: Optional[int] = Form(None),
    camera_code: Optional[str] = Form("CAM01"),
    camera_name: Optional[str] = Form("Railway Station Camera"),
    state: Optional[str] = Form("Puducherry"),
    city: Optional[str] = Form("Puducherry"),
    zone: Optional[str] = Form("Boulevard Town"),
    location_name: Optional[str] = Form("Railway Station Junction"),
    latitude: Optional[float] = Form(11.9360),
    longitude: Optional[float] = Form(79.8300),
    road_name: Optional[str] = Form("Railway Approach Road"),
    direction: Optional[str] = Form("Northbound"),
    video_date: Optional[str] = Form("2026-09-09"),
    video_start_time: Optional[str] = Form("09:00:00"),
    auto_analyze: Optional[bool] = Form(False),
    db: Session = Depends(get_db)
):
    """
    Uploads a CCTV video file and binds camera & timing metadata for trajectory reconstruction.
    """
    clean_filename = f"{int(datetime.utcnow().timestamp())}_{file.filename.replace(' ', '_')}"
    saved_path = os.path.join(UPLOAD_VIDEOS_DIR, clean_filename)

    with open(saved_path, "wb+") as f:
        shutil.copyfileobj(file.file, f)

    # Inspect video duration / fps if readable
    fps = 30.0
    duration_secs = 600.0
    width = 1920
    height = 1080
    total_frames = 18000
    try:
        source = UploadedVideoSource(saved_path)
        if source.open():
            meta = source.get_metadata()
            fps = meta["fps"]
            total_frames = meta["total_frames"]
            duration_secs = meta["duration_seconds"]
            width = meta["width"]
            height = meta["height"]
            source.release()
    except Exception as e:
        logger.warning(f"Could not extract properties from {file.filename}: {e}")

    # Link or locate camera
    existing_cam = None
    if camera_id:
        existing_cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not existing_cam and camera_code:
        existing_cam = db.query(Camera).filter(Camera.camera_code == camera_code).first()

    video_record = CameraVideo(
        video_name=file.filename,
        original_filename=file.filename,
        file_path=saved_path,
        camera_id=existing_cam.id if existing_cam else None,
        camera_code=camera_code or (existing_cam.camera_code if existing_cam else "CAM01"),
        camera_name=camera_name or (existing_cam.name if existing_cam else "Traffic Camera"),
        state=state,
        city=city,
        zone=zone,
        location_name=location_name,
        latitude=latitude or (existing_cam.latitude if existing_cam else 11.9425),
        longitude=longitude or (existing_cam.longitude if existing_cam else 79.8250),
        road_name=road_name,
        direction=direction,
        video_date=video_date,
        video_start_time=video_start_time,
        duration_seconds=duration_secs,
        fps=fps,
        width=width,
        height=height,
        total_frames=total_frames,
        analysis_status="UPLOADED",
        analysis_progress=0.0
    )

    db.add(video_record)
    db.commit()
    db.refresh(video_record)

    if auto_analyze:
        trigger_video_analysis(video_record.id)

    return {
        "status": "Success",
        "video_id": video_record.id,
        "video_name": video_record.video_name,
        "camera_code": video_record.camera_code,
        "location": video_record.location_name,
        "analysis_status": video_record.analysis_status,
        "message": f"Video '{file.filename}' uploaded successfully."
    }

@router.get("")
def list_uploaded_videos(db: Session = Depends(get_db)):
    """Returns all uploaded CCTV video records with processing stats."""
    videos = db.query(CameraVideo).order_by(CameraVideo.id.desc()).all()
    results = []
    for v in videos:
        results.append({
            "id": v.id,
            "video_name": v.video_name,
            "original_filename": v.original_filename,
            "camera_id": v.camera_id,
            "camera_code": v.camera_code,
            "camera_name": v.camera_name,
            "location_name": v.location_name,
            "city": v.city,
            "state": v.state,
            "direction": v.direction,
            "video_date": v.video_date,
            "video_start_time": v.video_start_time,
            "duration_seconds": v.duration_seconds,
            "fps": v.fps,
            "analysis_status": v.analysis_status,
            "analysis_progress": v.analysis_progress,
            "total_frames": v.total_frames,
            "processed_frames": v.processed_frames,
            "detections_count": v.detections_count,
            "created_at": v.created_at.isoformat() if v.created_at else None
        })
    return results

@router.get("/{video_id}")
def get_video_details(video_id: int, db: Session = Depends(get_db)):
    """Returns detailed video info and analysis metrics."""
    video = db.query(CameraVideo).filter(CameraVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    det_count = db.query(VehicleDetection).filter(VehicleDetection.video_id == video_id).count()
    return {
        "id": video.id,
        "video_name": video.video_name,
        "file_path": video.file_path,
        "camera_code": video.camera_code,
        "camera_name": video.camera_name,
        "location_name": video.location_name,
        "city": video.city,
        "latitude": video.latitude,
        "longitude": video.longitude,
        "direction": video.direction,
        "video_date": video.video_date,
        "video_start_time": video.video_start_time,
        "duration_seconds": video.duration_seconds,
        "fps": video.fps,
        "width": video.width,
        "height": video.height,
        "analysis_status": video.analysis_status,
        "analysis_progress": video.analysis_progress,
        "total_frames": video.total_frames,
        "processed_frames": video.processed_frames,
        "detections_count": det_count,
        "stream_url": f"/uploads/videos/{os.path.basename(video.file_path)}"
    }

@router.post("/{video_id}/analyze")
def trigger_analysis_endpoint(video_id: int, db: Session = Depends(get_db)):
    """Starts asynchronous AI frame extraction and plate detection for a video."""
    video = db.query(CameraVideo).filter(CameraVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    trigger_video_analysis(video.id)
    return {
        "status": "QUEUED",
        "video_id": video.id,
        "message": f"AI ANPR Analysis initiated for {video.video_name}."
    }

@router.get("/{video_id}/analysis-status")
def get_analysis_status(video_id: int, db: Session = Depends(get_db)):
    """Polls real-time progress of video analysis."""
    video = db.query(CameraVideo).filter(CameraVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    det_count = db.query(VehicleDetection).filter(VehicleDetection.video_id == video_id).count()
    return {
        "video_id": video.id,
        "analysis_status": video.analysis_status,
        "analysis_progress": video.analysis_progress,
        "total_frames": video.total_frames,
        "processed_frames": video.processed_frames,
        "detections_count": det_count,
        "error_message": video.error_message
    }

@router.get("/{video_id}/detections")
def get_video_detections(video_id: int, db: Session = Depends(get_db)):
    """Returns list of detections extracted from this specific video."""
    video = db.query(CameraVideo).filter(CameraVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    dets = db.query(VehicleDetection).filter(VehicleDetection.video_id == video_id).order_by(VehicleDetection.video_timestamp_seconds.asc()).all()
    
    unique_plates = len(set(d.plate_number for d in dets))
    valid_ocr_count = sum(1 for d in dets if d.ocr_confidence >= 0.85)

    return {
        "video_id": video.id,
        "video_name": video.video_name,
        "camera_code": video.camera_code,
        "total_detections": len(dets),
        "unique_plates": unique_plates,
        "valid_ocr_count": valid_ocr_count,
        "low_confidence_count": len(dets) - valid_ocr_count,
        "detections": [
            {
                "id": d.id,
                "plate_number": d.plate_number,
                "raw_ocr_text": d.raw_ocr_text or d.plate_number,
                "ocr_confidence": d.ocr_confidence,
                "vehicle_type": d.vehicle_type,
                "vehicle_color": d.vehicle_color,
                "frame_number": d.frame_number,
                "video_timestamp_seconds": d.video_timestamp_seconds,
                "absolute_timestamp": d.absolute_timestamp.isoformat() if d.absolute_timestamp else None,
                "plate_image": d.plate_image,
                "vehicle_image": d.vehicle_image,
                "match_status": d.match_status
            }
            for d in dets
        ]
    }

@router.delete("/{video_id}")
def delete_video(video_id: int, db: Session = Depends(get_db)):
    """Deletes video record and associated detection rows."""
    video = db.query(CameraVideo).filter(CameraVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Delete detections
    db.query(VehicleDetection).filter(VehicleDetection.video_id == video_id).delete()
    
    # Remove file on disk if exists
    if os.path.exists(video.file_path):
        try:
            os.remove(video.file_path)
        except Exception:
            pass

    db.delete(video)
    db.commit()
    return {"status": "Success", "message": f"Video {video_id} deleted successfully."}

@router.post("/seed-demo-bundle")
def seed_demo_4_camera_videos(db: Session = Depends(get_db)):
    """
    SIH 2026 Instant Showcase: Seeds 4 pre-configured CCTV camera videos
    (CAM01 Railway, CAM02 Bus Stand, CAM03 Main Road, CAM04 Airport Road)
    and automatically triggers analysis so the prototype flow can be evaluated immediately.
    """
    demo_configs = [
        ("camera01_railway.mp4", "CAM01", "Railway Station Main Gate", "Railway Station Junction", 11.9360, 79.8300, "Northbound", "09:00:00"),
        ("camera02_bus_stand.mp4", "CAM02", "Central Bus Terminus", "Bus Stand Commercial Area", 11.9425, 79.8250, "Northbound", "09:00:00"),
        ("camera03_main_road.mp4", "CAM03", "Gandhi Road Junction", "Main Arterial Intersection", 11.9480, 79.8180, "Northbound", "09:00:00"),
        ("camera04_airport_road.mp4", "CAM04", "Airport Expressway Access", "Expressway Toll Approach", 11.9680, 79.8020, "Northbound", "09:00:00")
    ]

    created_ids = []
    for filename, c_code, c_name, loc, lat, lon, dir_str, start_time in demo_configs:
        existing = db.query(CameraVideo).filter(CameraVideo.camera_code == c_code, CameraVideo.video_name == filename).first()
        if existing:
            created_ids.append(existing.id)
            trigger_video_analysis(existing.id)
            continue

        dummy_path = os.path.join(UPLOAD_VIDEOS_DIR, filename)
        if not os.path.exists(dummy_path):
            with open(dummy_path, "wb") as f:
                f.write(b"SIH_DEMO_CCTV_VIDEO_BUFFER_MOCK_STREAM")

        v = CameraVideo(
            video_name=filename,
            original_filename=filename,
            file_path=dummy_path,
            camera_code=c_code,
            camera_name=c_name,
            state="Puducherry",
            city="Puducherry",
            zone="Boulevard Town",
            location_name=loc,
            latitude=lat,
            longitude=lon,
            road_name=f"{loc} Corridor",
            direction=dir_str,
            video_date="2026-09-09",
            video_start_time=start_time,
            duration_seconds=3600.0,
            fps=30.0,
            total_frames=108000,
            analysis_status="UPLOADED",
            analysis_progress=0.0
        )
        db.add(v)
        db.commit()
        db.refresh(v)
        created_ids.append(v.id)
        trigger_video_analysis(v.id)

    return {
        "status": "Success",
        "message": "Seeded 4-camera video bundle (CAM01 -> CAM02 -> CAM03 -> CAM04) and started ANPR analysis.",
        "video_ids": created_ids
    }
