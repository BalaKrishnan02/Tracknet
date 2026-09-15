from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.camera import Camera
from app.models.detection import VehicleDetection
from app.schemas.camera import CameraCreate, CameraUpdate, CameraResponse

router = APIRouter(prefix="/cameras", tags=["Cameras"])

@router.get("", response_model=List[CameraResponse])
def get_all_cameras(db: Session = Depends(get_db)):
    cameras = db.query(Camera).all()
    results = []
    for c in cameras:
        v_count = db.query(VehicleDetection).filter(VehicleDetection.camera_id == c.id).count()
        last_det = (
            db.query(VehicleDetection)
            .filter(VehicleDetection.camera_id == c.id)
            .order_by(VehicleDetection.timestamp.desc())
            .first()
        )
        last_time = last_det.timestamp.strftime("%H:%M:%S") if last_det else "None"

        res = CameraResponse(
            id=c.id,
            camera_code=c.camera_code,
            name=c.name,
            location=c.location,
            latitude=c.latitude,
            longitude=c.longitude,
            status=c.status,
            stream_url=c.stream_url,
            created_at=c.created_at,
            vehicle_count_today=v_count,
            last_detection=last_time
        )
        results.append(res)
    return results

@router.post("", response_model=CameraResponse)
def create_camera(cam_in: CameraCreate, db: Session = Depends(get_db)):
    existing = db.query(Camera).filter(Camera.camera_code == cam_in.camera_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Camera code already registered")
    
    new_cam = Camera(**cam_in.model_dump())
    db.add(new_cam)
    db.commit()
    db.refresh(new_cam)
    return new_cam

@router.put("/{camera_id}", response_model=CameraResponse)
def update_camera(camera_id: int, cam_in: CameraUpdate, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")

    update_data = cam_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(cam, k, v)

    db.commit()
    db.refresh(cam)
    return cam

@router.delete("/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")

    db.delete(cam)
    db.commit()
    return {"message": "Camera deleted successfully"}
