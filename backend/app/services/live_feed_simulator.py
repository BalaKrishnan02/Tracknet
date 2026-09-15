"""
Live Feed Background Simulator
Periodically simulates new vehicle detections across cameras, checks against
the Watchlist, triggers real-time alerts, and pushes live updates to the WebSocket.
"""
import asyncio
import random
import logging
from datetime import datetime
from app.database import SessionLocal
from app.models.camera import Camera
from app.models.detection import VehicleDetection
from app.models.watchlist import Watchlist
from app.models.alert import Alert
from app.websocket.manager import manager
from app.config import settings

logger = logging.getLogger("traffitrace.live_simulator")

VEHICLE_TYPES = ["Car", "Bike", "Bus", "Truck", "Auto", "SUV"]
COLORS = ["White", "Silver", "Black", "Red", "Blue", "Grey", "Yellow"]

# Vehicles that occasionally cycle through cameras
SIMULATED_FLEET = [
    ("TN31AB4589", "Car", "White"),
    ("PY01AZ1234", "Bike", "Black"),
    ("TN72BK9087", "SUV", "Silver"),
    ("DL01C9876", "Truck", "Yellow"),
    ("KA05MJ4421", "Car", "Red"),
    ("MH12DE5544", "Car", "Blue"),
    ("TN09AZ4321", "Car", "White"),
    ("TN22CY7890", "Bike", "Red"),
    ("AP09CD1122", "Bus", "White"),
]

async def start_live_feed_simulation():
    """
    Background worker that pushes simulated detections every few seconds.
    """
    if not settings.DEMO_MODE:
        logger.info("DEMO_MODE is False. Live simulation ticker stopped.")
        return

    logger.info("Starting TraffiTrace AI Live Feed Simulator...")
    
    while True:
        try:
            await asyncio.sleep(settings.SIMULATION_INTERVAL_SECONDS)
            
            db = SessionLocal()
            try:
                cameras = db.query(Camera).filter(Camera.status == "Online").all()
                if not cameras:
                    continue

                cam = random.choice(cameras)

                # 30% chance of fleet vehicle, 70% random new vehicle
                if random.random() < 0.35:
                    plate, vtype, vcolor = random.choice(SIMULATED_FLEET)
                    raw_ocr = plate
                    # Occasional simulated OCR typo for demo inspection
                    if plate == "TN31AB4589" and random.random() < 0.25:
                        raw_ocr = "TN31A84589"
                else:
                    prefix = random.choice(["TN", "PY", "DL", "KA", "MH", "KL"])
                    rto = f"{random.randint(1, 99):02d}"
                    series = random.choice(["AB", "AZ", "BK", "CB", "MJ", "DE", "BH", "XY"])
                    num = f"{random.randint(1000, 9999)}"
                    plate = f"{prefix}{rto}{series}{num}"
                    raw_ocr = plate
                    vtype = random.choices(VEHICLE_TYPES, weights=[50, 25, 10, 8, 5, 2])[0]
                    vcolor = random.choice(COLORS)

                conf = round(random.uniform(0.91, 0.99), 2)
                speed = round(random.uniform(28.0, 72.0), 1)
                now = datetime.utcnow()

                det = VehicleDetection(
                    plate_number=plate,
                    raw_ocr_text=raw_ocr,
                    ocr_confidence=conf,
                    camera_id=cam.id,
                    vehicle_type=vtype,
                    vehicle_color=vcolor,
                    direction=random.choice(["Northbound", "Southbound", "Eastbound", "Westbound"]),
                    estimated_speed=speed,
                    timestamp=now,
                    vehicle_image=f"/static/vehicles/{vtype.lower()}_{vcolor.lower()}.jpg",
                    plate_image=f"/static/plates/{plate.lower()}_crop.jpg"
                )
                db.add(det)
                db.commit()
                db.refresh(det)

                # Check if watchlisted
                wl_item = db.query(Watchlist).filter(
                    Watchlist.plate_number == plate,
                    Watchlist.status == "Active"
                ).first()

                alert_data = None
                if wl_item:
                    alert = Alert(
                        detection_id=det.id,
                        plate_number=plate,
                        alert_type="Watchlist Hit",
                        priority=wl_item.priority,
                        message=f"Watchlisted Vehicle {plate} detected at {cam.name} ({wl_item.reason})",
                        status="Unreviewed",
                        created_at=now
                    )
                    db.add(alert)
                    db.commit()
                    db.refresh(alert)
                    
                    alert_data = {
                        "id": alert.id,
                        "plate_number": plate,
                        "priority": alert.priority,
                        "alert_type": alert.alert_type,
                        "message": alert.message,
                        "camera_name": cam.name,
                        "location": cam.location,
                        "created_at": alert.created_at.isoformat()
                    }

                # Broadcast to connected WebSocket clients
                payload = {
                    "type": "NEW_DETECTION",
                    "detection": {
                        "id": det.id,
                        "plate_number": det.plate_number,
                        "raw_ocr_text": det.raw_ocr_text,
                        "ocr_confidence": det.ocr_confidence,
                        "camera_id": cam.id,
                        "camera_code": cam.camera_code,
                        "camera_name": cam.name,
                        "camera_location": cam.location,
                        "latitude": cam.latitude,
                        "longitude": cam.longitude,
                        "vehicle_type": det.vehicle_type,
                        "vehicle_color": det.vehicle_color,
                        "direction": det.direction,
                        "estimated_speed": det.estimated_speed,
                        "timestamp": det.timestamp.isoformat(),
                        "is_watchlisted": wl_item is not None
                    },
                    "alert": alert_data
                }

                await manager.broadcast(payload)

            finally:
                db.close()

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in live feed simulator: {e}", exc_info=True)
            await asyncio.sleep(2)
