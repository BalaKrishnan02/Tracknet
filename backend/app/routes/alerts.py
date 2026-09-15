from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(status: Optional[str] = None, priority: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if priority:
        query = query.filter(Alert.priority == priority)

    alerts = query.order_by(Alert.created_at.desc()).all()
    results = []
    for a in alerts:
        det = a.detection
        cam = det.camera if det else None
        results.append({
            "id": a.id,
            "detection_id": a.detection_id,
            "plate_number": a.plate_number,
            "alert_type": a.alert_type,
            "priority": a.priority,
            "message": a.message,
            "status": a.status,
            "created_at": a.created_at,
            "camera_name": cam.name if cam else "City Surveillance",
            "location": cam.location if cam else "Metro Zone",
            "detection_time": det.timestamp if det else a.created_at,
            "vehicle_image": det.vehicle_image if det else None
        })
    return results

@router.put("/{alert_id}/review")
def mark_alert_reviewed(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "Reviewed"
    db.commit()
    return {"message": "Alert status updated to Reviewed", "id": alert_id}

@router.delete("/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}
