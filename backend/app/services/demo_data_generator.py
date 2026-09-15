"""
Demo Data Generator for SIH 2026 Hackathon
Pre-seeds realistic traffic cameras, users, watchlists, multi-camera journeys,
and hourly statistics for zero-setup demonstration.
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.camera import Camera
from app.models.detection import VehicleDetection
from app.models.watchlist import Watchlist
from app.models.alert import Alert
from app.models.traffic import TrafficStatistic
from app.utils.security import get_password_hash
from app.ai.plate_validator import normalize_plate_text

SAMPLE_CAMERAS = [
    {"camera_code": "CAM01", "name": "Railway Station Main Gate", "location": "Railway Station", "latitude": 11.9360, "longitude": 79.8300, "status": "Online"},
    {"camera_code": "CAM02", "name": "Central Bus Terminus", "location": "Bus Stand", "latitude": 11.9425, "longitude": 79.8250, "status": "Online"},
    {"camera_code": "CAM03", "name": "Gandhi Road Junction", "location": "Main Road", "latitude": 11.9480, "longitude": 79.8180, "status": "Online"},
    {"camera_code": "CAM04", "name": "Engineering College Gate", "location": "College Road", "latitude": 11.9540, "longitude": 79.8100, "status": "Online"},
    {"camera_code": "CAM05", "name": "Airport Expressway Toll", "location": "Airport Road", "latitude": 11.9680, "longitude": 79.8020, "status": "Online"},
]

WATCHLIST_DEMO = [
    {"plate_number": "TN31AB4589", "reason": "Demo Security Watchlist - Flagged in Inter-District Alert", "priority": "High", "status": "Active"},
    {"plate_number": "PY01AZ1234", "reason": "Traffic Law Violation - Speeding Violator", "priority": "Medium", "status": "Active"},
    {"plate_number": "DL01C9876", "reason": "Unauthorized Heavy Vehicle in City Zone", "priority": "Critical", "status": "Active"}
]

OTHER_MULTI_CAM_VEHICLES = [
    ("PY01AZ1234", "Bike", "Black", ["CAM01", "CAM02", "CAM04"]),  # Pondicherry
    ("DL01C9876", "Truck", "Yellow", ["IND-DL-DEL-CAM001", "IND-DL-DEL-CAM002", "IND-DL-DEL-CAM003", "IND-DL-DEL-CAM005"]),  # New Delhi
    ("KA05MJ4421", "Car", "Red", ["IND-KA-BLR-CAM001", "IND-KA-BLR-CAM002", "IND-KA-BLR-CAM004", "IND-KA-BLR-CAM005"]),  # Bengaluru
    ("MH12DE5544", "Car", "Blue", ["IND-MH-MUM-CAM001", "IND-MH-MUM-CAM003", "IND-MH-MUM-CAM004", "IND-MH-MUM-CAM005"]),  # Mumbai
    ("TN72BK9087", "SUV", "Silver", ["IND-TN-CHN-CAM001", "IND-TN-CHN-CAM002", "IND-TN-CHN-CAM004", "IND-TN-CHN-CAM005"]),  # Chennai
    ("TS09CD1122", "Bus", "White", ["IND-TS-HYD-CAM001", "IND-TS-HYD-CAM002", "IND-TS-HYD-CAM004", "IND-TS-HYD-CAM005"]),  # Hyderabad
    ("KL07BH3322", "Auto", "Green", ["IND-KL-COK-CAM001", "IND-KL-COK-CAM002", "IND-KL-COK-CAM003", "IND-KL-COK-CAM004"]),  # Kochi
    ("WB02EF4433", "Car", "Yellow", ["IND-WB-CCU-CAM001", "IND-WB-CCU-CAM002", "IND-WB-CCU-CAM004", "IND-WB-CCU-CAM005"]),  # Kolkata
    ("GJ01XY8899", "Car", "White", ["IND-GJ-AMD-CAM001", "IND-GJ-AMD-CAM002", "IND-GJ-AMD-CAM004", "IND-GJ-AMD-CAM005"]),  # Ahmedabad
]

VEHICLE_TYPES = ["Car", "Bike", "Bus", "Truck", "Auto", "SUV"]
COLORS = ["White", "Silver", "Black", "Red", "Blue", "Grey", "Yellow"]

def seed_demo_database(db: Session):
    """
    Seeds initial data if database is empty.
    """
    # 1. Check users
    if not db.query(User).first():
        admin = User(
            name="Super Admin",
            email="admin@traffitrace.ai",
            password_hash=get_password_hash("Admin@123"),
            role="Admin"
        )
        officer = User(
            name="Inspector Kumar",
            email="officer@traffitrace.ai",
            password_hash=get_password_hash("Officer@123"),
            role="Traffic Officer"
        )
        analyst = User(
            name="Dr. Priya (Analyst)",
            email="analyst@traffitrace.ai",
            password_hash=get_password_hash("Analyst@123"),
            role="Traffic Analyst"
        )
        db.add_all([admin, officer, analyst])
        db.commit()

    # 2. Check Cameras
    cameras_map = {}
    if not db.query(Camera).first():
        for c in SAMPLE_CAMERAS:
            cam = Camera(
                camera_code=c["camera_code"],
                name=c["name"],
                location=c["location"],
                latitude=c["latitude"],
                longitude=c["longitude"],
                status=c["status"],
                stream_url=f"/static/feeds/{c['camera_code'].lower()}_stream.mp4"
            )
            db.add(cam)
        db.commit()

    for cam in db.query(Camera).all():
        cameras_map[cam.camera_code] = cam

    # 3. Check Watchlist
    if not db.query(Watchlist).first():
        for w in WATCHLIST_DEMO:
            wl = Watchlist(
                plate_number=normalize_plate_text(w["plate_number"]),
                reason=w["reason"],
                priority=w["priority"],
                status=w["status"],
                added_by="Admin"
            )
            db.add(wl)
        db.commit()

    # 4. Check Detections
    if not db.query(VehicleDetection).first():
        now = datetime.utcnow()
        base_time = now.replace(hour=8, minute=30, second=0, microsecond=0)

        # Main Hackathon Demo Trajectory for TN31AB4589
        # CAM01 (09:10) -> CAM02 (09:17) -> CAM03 (09:28 with OCR typo TN31A84589) -> CAM05 (09:45)
        demo_journey = [
            ("CAM01", base_time + timedelta(minutes=40), "TN31AB4589", "TN31AB4589", 0.98, 48.0),
            ("CAM02", base_time + timedelta(minutes=47), "TN31AB4589", "TN31AB4589", 0.96, 42.0),
            ("CAM03", base_time + timedelta(minutes=58), "TN31AB4589", "TN31A84589", 0.89, 50.0),  # Imperfect OCR typo '8' for 'B'
            ("CAM05", base_time + timedelta(minutes=75), "TN31AB4589", "TN31AB4589", 0.97, 55.0),
        ]

        for cam_code, t_stamp, clean_plate, raw_plate, conf, speed in demo_journey:
            cam = cameras_map.get(cam_code)
            if cam:
                det = VehicleDetection(
                    plate_number=clean_plate,
                    raw_ocr_text=raw_plate,
                    ocr_confidence=conf,
                    camera_id=cam.id,
                    vehicle_type="Car",
                    vehicle_color="White",
                    direction="Northbound",
                    estimated_speed=speed,
                    timestamp=t_stamp,
                    vehicle_image=f"/static/vehicles/car_white_{cam_code.lower()}.jpg",
                    plate_image=f"/static/plates/{clean_plate.lower()}_crop.jpg",
                    validation_score=1.0 if clean_plate == raw_plate else 0.88
                )
                db.add(det)
                db.flush()

                # Add initial alert for watchlisted vehicle detection
                if cam_code in ["CAM01", "CAM05"]:
                    alert = Alert(
                        detection_id=det.id,
                        plate_number=clean_plate,
                        alert_type="Watchlist Hit",
                        priority="High",
                        message=f"Watchlist vehicle {clean_plate} detected at {cam.name}",
                        status="Unreviewed",
                        created_at=t_stamp
                    )
                    db.add(alert)

        # Add other multi-camera vehicles
        for plate, vtype, vcolor, cam_list in OTHER_MULTI_CAM_VEHICLES:
            v_start = base_time + timedelta(minutes=random.randint(10, 90))
            for i, c_code in enumerate(cam_list):
                cam = cameras_map.get(c_code)
                if cam:
                    det_time = v_start + timedelta(minutes=i * random.randint(8, 16))
                    det = VehicleDetection(
                        plate_number=plate,
                        raw_ocr_text=plate,
                        ocr_confidence=round(random.uniform(0.93, 0.99), 2),
                        camera_id=cam.id,
                        vehicle_type=vtype,
                        vehicle_color=vcolor,
                        direction="Southbound" if i % 2 == 0 else "Northbound",
                        estimated_speed=round(random.uniform(35.0, 65.0), 1),
                        timestamp=det_time,
                        vehicle_image=f"/static/vehicles/{vtype.lower()}_{vcolor.lower()}.jpg",
                        plate_image=f"/static/plates/{plate.lower()}_crop.jpg"
                    )
                    db.add(det)

        # Generate 500+ realistic single & background detections across cameras
        state_prefixes = ["TN", "PY", "DL", "KA", "MH", "KL"]
        for i in range(520):
            prefix = random.choice(state_prefixes)
            rto = f"{random.randint(1, 99):02d}"
            series = random.choice(["AB", "AZ", "BK", "CB", "MJ", "DE", "BH", "XY"])
            num = f"{random.randint(1000, 9999)}"
            plate = f"{prefix}{rto}{series}{num}"
            
            cam_code = random.choice(list(cameras_map.keys()))
            cam = cameras_map[cam_code]
            rand_time = base_time + timedelta(minutes=random.randint(0, 360), seconds=random.randint(0, 59))
            vtype = random.choices(VEHICLE_TYPES, weights=[50, 25, 10, 8, 5, 2])[0]
            vcolor = random.choice(COLORS)
            
            det = VehicleDetection(
                plate_number=plate,
                raw_ocr_text=plate,
                ocr_confidence=round(random.uniform(0.88, 0.99), 2),
                camera_id=cam.id,
                vehicle_type=vtype,
                vehicle_color=vcolor,
                direction=random.choice(["Northbound", "Southbound", "Eastbound", "Westbound"]),
                estimated_speed=round(random.uniform(25.0, 75.0), 1),
                timestamp=rand_time,
                vehicle_image=f"/static/vehicles/{vtype.lower()}_{vcolor.lower()}.jpg"
            )
            db.add(det)

        # 5. Populate hourly traffic stats
        for cam in cameras_map.values():
            for h in range(7, 20):
                is_peak = h in [9, 10, 17, 18]
                base_c = 45 if is_peak else 20
                cars = base_c + random.randint(5, 25)
                bikes = int(cars * random.uniform(0.4, 0.7))
                buses = random.randint(3, 10)
                trucks = random.randint(2, 8)
                total = cars + bikes + buses + trucks
                
                cong = "Critical" if total > 90 else ("High" if total > 60 else ("Medium" if total > 30 else "Low"))
                
                stat = TrafficStatistic(
                    camera_id=cam.id,
                    date=datetime.utcnow().strftime("%Y-%m-%d"),
                    hour=h,
                    car_count=cars,
                    bike_count=bikes,
                    bus_count=buses,
                    truck_count=trucks,
                    other_count=random.randint(1, 5),
                    total_count=total,
                    average_speed=round(random.uniform(32.0, 55.0), 1),
                    congestion_level=cong
                )
                db.add(stat)

        db.commit()
