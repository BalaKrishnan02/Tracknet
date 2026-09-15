"""
India-Wide Demo ANPR Camera Network Generator
Seeds realistic hierarchical data across Indian states, cities, zones, and 160+ camera nodes.
Conforms to naming convention: COUNTRY-STATE-CITY-CAM###
Marks all records as SIMULATED / DEMO DATA for Smart India Hackathon 2026.
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.location import State, City, Zone
from app.models.camera import Camera
from app.services.camera_placement_engine import calculate_placement_score

# Representative nationwide cities
INDIA_CITIES_REGISTRY = [
    # Tamil Nadu & Puducherry
    {"state": "Tamil Nadu", "state_code": "TN", "city": "Chennai", "city_code": "CHN", "lat": 13.0827, "lon": 80.2707, "tier": "Tier-1", "zones": ["North Zone", "Central Business District", "South Tech Corridor", "West Industrial"]},
    {"state": "Tamil Nadu", "state_code": "TN", "city": "Coimbatore", "city_code": "CBE", "lat": 11.0168, "lon": 76.9558, "tier": "Tier-2", "zones": ["City Center", "Peelamedu", "Gandhipuram", "Saravanampatti"]},
    {"state": "Tamil Nadu", "state_code": "TN", "city": "Madurai", "city_code": "MDU", "lat": 9.9252, "lon": 78.1198, "tier": "Tier-2", "zones": ["Meenakshi Temple Zone", "Mattuthavani", "Anna Nagar"]},
    {"state": "Puducherry", "state_code": "PY", "city": "Pondicherry", "city_code": "PDY", "lat": 11.9416, "lon": 79.8083, "tier": "State Capital", "zones": ["Boulevard Town", "East Coast Highway", "Villiyanur Junction"]},

    # Karnataka
    {"state": "Karnataka", "state_code": "KA", "city": "Bengaluru", "city_code": "BLR", "lat": 12.9716, "lon": 77.5946, "tier": "Tier-1", "zones": ["Electronic City", "Whitefield IT Hub", "CBD MG Road", "Hebbal North Gateway", "Outer Ring Road"]},
    {"state": "Karnataka", "state_code": "KA", "city": "Mysuru", "city_code": "MYS", "lat": 12.2958, "lon": 76.6394, "tier": "Tier-2", "zones": ["Palace Zone", "Hebbal Industrial", "Vijayanagar"]},

    # Maharashtra
    {"state": "Maharashtra", "state_code": "MH", "city": "Mumbai", "city_code": "MUM", "lat": 19.0760, "lon": 72.8777, "tier": "Tier-1", "zones": ["South Mumbai Heritage", "Bandra-Kurla Complex", "Western Expressway", "Eastern Freeway", "Navi Mumbai Gateway"]},
    {"state": "Maharashtra", "state_code": "MH", "city": "Pune", "city_code": "PUN", "lat": 18.5204, "lon": 73.8567, "tier": "Tier-1", "zones": ["Hinjewadi Tech Hub", "Shivajinagar Central", "Kharadi Bypass", "Hadapsar Industrial"]},
    {"state": "Maharashtra", "state_code": "MH", "city": "Nagpur", "city_code": "NGP", "lat": 21.1458, "lon": 79.0882, "tier": "Tier-2", "zones": ["MIHAN SEZ", "Sitabuldi Interchange", "Ring Road East"]},

    # Delhi NCR
    {"state": "Delhi", "state_code": "DL", "city": "New Delhi", "city_code": "DEL", "lat": 28.6139, "lon": 77.2090, "tier": "State Capital", "zones": ["Connaught Place CBD", "Ring Road Dhaula Kuan", "Aerocity Corridor", "NH-48 Border Gateway", "Trans-Yamuna East"]},

    # Telangana & Andhra Pradesh
    {"state": "Telangana", "state_code": "TS", "city": "Hyderabad", "city_code": "HYD", "lat": 17.3850, "lon": 78.4867, "tier": "Tier-1", "zones": ["HITEC City Cyber Corridor", "Secunderabad Junction", "Gachibowli Ring Road", "Old City Heritage", "Airport Expressway"]},
    {"state": "Andhra Pradesh", "state_code": "AP", "city": "Visakhapatnam", "city_code": "VTZ", "lat": 17.6868, "lon": 83.2185, "tier": "Tier-2", "zones": ["Port Approach", "Beach Road", "Gajuwaka Industrial", "Madhurawada"]},

    # Gujarat
    {"state": "Gujarat", "state_code": "GJ", "city": "Ahmedabad", "city_code": "AMD", "lat": 23.0225, "lon": 72.5714, "tier": "Tier-1", "zones": ["SG Highway Corridor", "Sabarmati Riverfront", "SP Ring Road Toll", "Kalupur Station"]},
    {"state": "Gujarat", "state_code": "GJ", "city": "Surat", "city_code": "SRT", "lat": 21.1702, "lon": 72.8311, "tier": "Tier-2", "zones": ["Ring Road Textile", "Dumas Coastal", "Katargam Industrial"]},

    # Rajasthan
    {"state": "Rajasthan", "state_code": "RJ", "city": "Jaipur", "city_code": "JPR", "lat": 26.9124, "lon": 75.7873, "tier": "State Capital", "zones": ["Pink City Walled Gate", "MI Road Central", "Tonk Road NH-52", "JLN Marg Corridor"]},

    # West Bengal
    {"state": "West Bengal", "state_code": "WB", "city": "Kolkata", "city_code": "CCU", "lat": 22.5726, "lon": 88.3639, "tier": "Tier-1", "zones": ["Park Street CBD", "Salt Lake Sector V", "Howrah Bridge Approach", "EM Bypass South", "Rajarhat Expressway"]},

    # Uttar Pradesh
    {"state": "Uttar Pradesh", "state_code": "UP", "city": "Lucknow", "city_code": "LKO", "lat": 26.8467, "lon": 80.9462, "tier": "State Capital", "zones": ["Hazratganj Central", "Shaheed Path Bypass", "Gomti Nagar IT City"]},
    {"state": "Uttar Pradesh", "state_code": "UP", "city": "Noida", "city_code": "NOI", "lat": 28.5355, "lon": 77.3910, "tier": "Tier-1", "zones": ["DND Flyway Entry", "Greater Noida Expressway", "Sector 62 IT Hub"]},

    # Kerala
    {"state": "Kerala", "state_code": "KL", "city": "Kochi", "city_code": "COK", "lat": 9.9312, "lon": 76.2673, "tier": "Tier-2", "zones": ["Edappally Bypass Junction", "MG Road Commercial", "Vyttila Mobility Hub", "Kakkanad InfoPark"]},

    # Punjab & Haryana
    {"state": "Chandigarh", "state_code": "CH", "city": "Chandigarh", "city_code": "IXC", "lat": 30.7333, "lon": 76.7794, "tier": "State Capital", "zones": ["Sector 17 Plaza", "Madhya Marg Arterial", "Tribune Chowk Flyover"]},

    # Madhya Pradesh
    {"state": "Madhya Pradesh", "state_code": "MP", "city": "Indore", "city_code": "IDR", "lat": 22.7196, "lon": 75.8577, "tier": "Tier-2", "zones": ["AB Road BRTS Corridor", "Bhawarkua Junction", "Super Corridor Airport"]},
    {"state": "Madhya Pradesh", "state_code": "MP", "city": "Bhopal", "city_code": "BHO", "lat": 23.2599, "lon": 77.4126, "tier": "State Capital", "zones": ["MP Nagar Commercial", "Hoshangabad Road Entry", "Upper Lake VIP Road"]},

    # Bihar & Assam
    {"state": "Bihar", "state_code": "BR", "city": "Patna", "city_code": "PAT", "lat": 25.5941, "lon": 85.1376, "tier": "State Capital", "zones": ["Bailey Road Arterial", "Gandhi Maidan Center", "Patna-Gaya Highway"]},
    {"state": "Assam", "state_code": "AS", "city": "Guwahati", "city_code": "GAU", "lat": 26.1445, "lon": 91.7362, "tier": "State Capital", "zones": ["GS Road Commercial", "Jalukbari NH-27 Intersect", "Paltan Bazar Station"]},
]

SAMPLE_LOCATION_TEMPLATES = [
    ("City Entry Toll Plaza", "CITY_ENTRY", "NATIONAL_HIGHWAY", "Pole Gantry", 38000, "High"),
    ("Outer Ring Road Junction", "MAJOR_JUNCTION", "RING_ROAD", "Gantry Mount", 42000, "Critical"),
    ("Railway Station Main Approach", "RAILWAY_STATION_ROAD", "ARTERIAL_ROAD", "Cantilever", 28000, "High"),
    ("Central Bus Terminus Gateway", "BUS_TERMINAL_ROAD", "ARTERIAL_ROAD", "Pole Mount", 31000, "Medium"),
    ("Airport Expressway Access Road", "AIRPORT_ROAD", "NATIONAL_HIGHWAY", "Overpass Mount", 34000, "Medium"),
    ("Inter-State Highway Bypass", "BYPASS", "STATE_HIGHWAY", "Gantry Mount", 26000, "Medium"),
    ("Metro Elevated Corridor Underpass", "MAJOR_JUNCTION", "ARTERIAL_ROAD", "Pillar Mount", 29000, "High"),
    ("Commercial Market Chokepoint", "COMMERCIAL_AREA", "ARTERIAL_ROAD", "Pole Mount", 24000, "Critical"),
    ("Accident Blackspot Curve", "TRAFFIC_BLACKSPOT", "NATIONAL_HIGHWAY", "Hazard Pole", 32000, "Critical"),
    ("Heavy Freight Logistics Corridor", "LOGISTICS_CORRIDOR", "STATE_HIGHWAY", "Gantry Mount", 27000, "Medium"),
]

def seed_india_network(db: Session):
    """
    Seeds hierarchical State, City, Zone entities and 160+ ANPR camera records.
    Preserves existing CAM01-CAM05 seamlessly.
    """
    # 1. Populate States
    state_cache = {}
    for item in INDIA_CITIES_REGISTRY:
        s_name = item["state"]
        s_code = item["state_code"]
        existing_s = db.query(State).filter(State.name == s_name).first()
        if not existing_s:
            existing_s = State(code=s_code, name=s_name, country="India", latitude=item["lat"], longitude=item["lon"])
            db.add(existing_s)
            db.flush()
        state_cache[s_name] = existing_s

    # 2. Populate Cities & Zones
    city_cache = {}
    for item in INDIA_CITIES_REGISTRY:
        s_obj = state_cache[item["state"]]
        c_obj = db.query(City).filter(City.name == item["city"]).first()
        if not c_obj:
            c_obj = City(
                state_id=s_obj.id,
                code=item["city_code"],
                name=item["city"],
                tier=item["tier"],
                latitude=item["lat"],
                longitude=item["lon"]
            )
            db.add(c_obj)
            db.flush()
            
            # Add Zones
            for z_idx, z_name in enumerate(item["zones"]):
                z_code = f"{item['city_code']}-Z{z_idx+1}"
                zone_obj = Zone(city_id=c_obj.id, code=z_code, name=z_name, coverage_score=random.uniform(55.0, 92.0))
                db.add(zone_obj)
            db.flush()

        city_cache[item["city"]] = c_obj

    db.commit()

    # 3. Check existing camera count
    existing_cameras = db.query(Camera).all()
    
    # If we already have the initial 5 cameras (CAM01-CAM05), update their metadata with nationwide hierarchy
    for c in existing_cameras:
        if c.camera_code in ["CAM01", "CAM02", "CAM03", "CAM04", "CAM05"]:
            c.country = "India"
            c.state = "Puducherry"
            c.district = "Pondicherry"
            c.city = "Pondicherry"
            c.zone = "Boulevard Town"
            c.location_name = c.location
            c.road_name = f"{c.location} Road"
            c.road_type = "ARTERIAL_ROAD"
            c.location_type = "MAJOR_JUNCTION" if "Junction" in c.name or "Road" in c.name else "BUS_TERMINAL_ROAD"
            c.camera_source = "DEMO_VIDEO"
            c.status = "Active"
            c.placement_score = 92.0
            c.placement_priority = "CRITICAL"
            c.placement_reason = "High urban volume intersection linking railway, bus stand, and airport corridor"
            c.traffic_level = "High"
            c.estimated_daily_volume = 32000
            c.coverage_status = "Covered"
            c.is_proposed = False

    db.commit()

    # If already expanded to 150+ cameras, return
    if len(existing_cameras) >= 150:
        return

    # 4. Generate 160+ nationwide ANPR camera records
    camera_id_seq = len(existing_cameras) + 1
    new_cameras = []

    for item in INDIA_CITIES_REGISTRY:
        city_name = item["city"]
        state_name = item["state"]
        c_code = item["city_code"]
        s_code = item["state_code"]
        base_lat = item["lat"]
        base_lon = item["lon"]
        zones = item["zones"]

        # 6 to 10 cameras per city (mix of Active, Offline, Maintenance, Proposed)
        cams_per_city = 8 if item["tier"] == "Tier-1" else 6
        
        for i in range(cams_per_city):
            cam_code = f"IND-{s_code}-{c_code}-CAM{i+1:03d}"
            
            # Avoid duplicate code
            if db.query(Camera).filter(Camera.camera_code == cam_code).first():
                continue

            tmpl = SAMPLE_LOCATION_TEMPLATES[i % len(SAMPLE_LOCATION_TEMPLATES)]
            loc_title = f"{city_name} {tmpl[0]}"
            loc_type = tmpl[1]
            road_type = tmpl[2]
            install_type = tmpl[3]
            daily_vol = tmpl[4] + random.randint(-4000, 6000)
            traffic_lvl = tmpl[5]

            # Realistic status distribution: 80% Active, 10% Proposed, 5% Offline, 5% Maintenance
            roll = random.random()
            if roll < 0.78:
                status = "Active"
                is_prop = False
            elif roll < 0.90:
                status = "Proposed"
                is_prop = True
            elif roll < 0.95:
                status = "Offline"
                is_prop = False
            else:
                status = "Maintenance"
                is_prop = False

            # Offset GPS slightly around city center (+- 0.04 deg approx 4 km)
            cam_lat = round(base_lat + random.uniform(-0.045, 0.045), 5)
            cam_lon = round(base_lon + random.uniform(-0.045, 0.045), 5)

            assigned_zone = zones[i % len(zones)]

            # Calculate placement score & transparent reasons
            score_data = calculate_placement_score({
                "estimated_daily_volume": daily_vol,
                "location_type": loc_type,
                "road_type": road_type,
                "traffic_level": traffic_lvl,
                "coverage_status": "Gap" if is_prop else "Covered"
            })

            cam = Camera(
                camera_code=cam_code,
                name=f"{loc_title} (SIMULATED / DEMO CAMERA)",
                country="India",
                state=state_name,
                district=city_name,
                city=city_name,
                zone=assigned_zone,
                location=loc_title,
                location_name=loc_title,
                road_name=f"{city_name} {road_type.replace('_', ' ').title()}",
                road_type=road_type,
                location_type=loc_type,
                latitude=cam_lat,
                longitude=cam_lon,
                direction=score_data["recommended_direction"],
                lanes_covered=score_data["recommended_lanes"],
                status=status,
                camera_source="DEMO_VIDEO",
                stream_url=f"/static/feeds/{cam_code.lower()}_demo.mp4",
                installation_type=install_type,
                placement_score=score_data["placement_score"],
                placement_priority=score_data["priority"],
                placement_reason="; ".join(score_data["reasons"]),
                traffic_level=traffic_lvl,
                estimated_daily_volume=daily_vol,
                coverage_status="Proposed" if is_prop else "Covered",
                is_proposed=is_prop,
                last_seen=datetime.utcnow() - timedelta(minutes=random.randint(1, 45))
            )
            new_cameras.append(cam)

    if new_cameras:
        db.add_all(new_cameras)
        db.commit()
