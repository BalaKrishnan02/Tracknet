from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.detection import VehicleDetection
from app.schemas.detection import DetectionResponse

router = APIRouter(prefix="/detections", tags=["Detections"])

@router.get("", response_model=List[DetectionResponse])
def get_detections(
    skip: int = 0,
    limit: int = 50,
    camera_id: Optional[int] = None,
    vehicle_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(VehicleDetection)
    if camera_id:
        query = query.filter(VehicleDetection.camera_id == camera_id)
    if vehicle_type:
        query = query.filter(VehicleDetection.vehicle_type == vehicle_type)

    dets = query.order_by(VehicleDetection.timestamp.desc()).offset(skip).limit(limit).all()
    results = []
    for d in dets:
        cam = d.camera
        results.append({
            "id": d.id,
            "plate_number": d.plate_number,
            "raw_ocr_text": d.raw_ocr_text or d.plate_number,
            "ocr_confidence": d.ocr_confidence,
            "camera_id": d.camera_id,
            "camera_code": cam.camera_code if cam else "CAM",
            "camera_name": cam.name if cam else "Camera",
            "camera_location": cam.location if cam else "Location",
            "latitude": cam.latitude if cam else 11.94,
            "longitude": cam.longitude if cam else 79.82,
            "vehicle_type": d.vehicle_type,
            "vehicle_color": d.vehicle_color,
            "direction": d.direction,
            "estimated_speed": d.estimated_speed,
            "timestamp": d.timestamp,
            "vehicle_image": d.vehicle_image,
            "plate_image": d.plate_image,
            "validation_score": d.validation_score
        })
    return results

@router.get("/recent", response_model=List[DetectionResponse])
def get_recent_detections(limit: int = 15, db: Session = Depends(get_db)):
    return get_detections(skip=0, limit=limit, db=db)
