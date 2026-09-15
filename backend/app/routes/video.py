from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
import random
from datetime import datetime
from app.database import get_db
from app.models.camera import Camera
from app.models.detection import VehicleDetection
from app.models.watchlist import Watchlist
from app.models.alert import Alert
from app.websocket.manager import manager

router = APIRouter(prefix="/video", tags=["Video Processing"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_traffic_video(
    file: UploadFile = File(...),
    camera_id: int = Form(...),
    db: Session = Depends(get_db)
):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Selected camera does not exist")

    file_location = os.path.join(UPLOAD_DIR, f"cam_{camera_id}_{file.filename}")
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    return {
        "filename": file.filename,
        "camera_id": camera_id,
        "camera_name": cam.name,
        "saved_path": file_location,
        "message": "Video successfully uploaded and ready for ANPR pipeline processing"
    }

@router.post("/process")
async def process_video_feed(camera_id: int = Form(...), db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Selected camera does not exist")

    # Simulate processing pipeline: Frame Extraction -> Vehicle Detection -> Plate Crop -> OCR -> Match
    plates = ["TN31AB4589", "PY01AZ1234", "TN72BK9087", "DL01C9876", "KA05MJ4421"]
    detected_plate = random.choice(plates)
    now = datetime.utcnow()

    det = VehicleDetection(
        plate_number=detected_plate,
        raw_ocr_text=detected_plate,
        ocr_confidence=0.97,
        camera_id=cam.id,
        vehicle_type="Car",
        vehicle_color="White",
        direction="Northbound",
        estimated_speed=52.0,
        timestamp=now,
        vehicle_image="/static/vehicles/car_white.jpg",
        plate_image=f"/static/plates/{detected_plate.lower()}_crop.jpg"
    )
    db.add(det)
    db.commit()
    db.refresh(det)

    # Check alert
    wl = db.query(Watchlist).filter(Watchlist.plate_number == detected_plate).first()
    if wl:
        alert = Alert(
            detection_id=det.id,
            plate_number=detected_plate,
            alert_type="Watchlist Hit",
            priority=wl.priority,
            message=f"Watchlist vehicle {detected_plate} detected during video stream processing at {cam.name}",
            status="Unreviewed",
            created_at=now
        )
        db.add(alert)
        db.commit()

    return {
        "status": "Success",
        "camera": cam.name,
        "detected_plate": detected_plate,
        "confidence": 0.97,
        "timestamp": now.isoformat(),
        "message": f"Successfully processed video feed and extracted {detected_plate}."
    }
