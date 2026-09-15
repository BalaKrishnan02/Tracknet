# TraffiTrace AI – City-Wide Multi-Camera ANPR Vehicle Tracking and Traffic Analytics Platform

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in/)
[![Problem Statement ID](https://img.shields.io/badge/Problem%20Statement-26127-orange.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)]()
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)]()
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-GIS%20Maps-199900.svg?logo=leaflet&logoColor=white)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()

> **Smart India Hackathon (SIH) 2026 – Problem Statement ID: 26127**  
> **TraffiTrace AI** is a city-wide multi-camera ANPR vehicle tracking, trajectory reconstruction, and traffic analytics platform designed for modern command & control centers, law enforcement, and urban transit authorities.

---

## 📌 Key Highlights & Features

1. **Multi-Camera Spatiotemporal Trajectory Reconstruction**:
   - Matches license plates across disparate CCTV nodes.
   - Intelligent **OCR Typo Tolerance Engine** with Levenshtein distance and character confusion matrices (e.g. OCR misreading `8` for `B`, `0` for `O`, `1` for `I`).
   - Kinematic speed and distance feasibility checks using the **Haversine formula**.
   - Chronological GIS route visualization on interactive OpenStreetMap / Leaflet polylines.

2. **Real-Time ANPR Video Pipeline & Live Feed Simulation**:
   - Frame Extraction $\rightarrow$ Vehicle Detection $\rightarrow$ Plate Detection $\rightarrow$ OCR $\rightarrow$ Indian Plate Validation $\rightarrow$ Database Ingestion.
   - Built-in **Background Live Feed Simulator** streaming real-time detections and alerts to frontend clients over **WebSockets** (`/ws/live-detections`).

3. **Dual Execution Mode (`DEMO_MODE`)**:
   - `DEMO_MODE=true`: Out-of-the-box spatiotemporal simulation with 500+ pre-seeded detections, multi-camera journeys, hourly congestion profiles, and live alerts without requiring GPU/weights.
   - `DEMO_MODE=false`: Real OpenCV + YOLO + PaddleOCR computer vision pipeline for live video feeds and uploaded clips.

4. **Comprehensive Urban Traffic Analytics**:
   - Modal split (Cars, Bikes, Buses, Trucks, Autos).
   - Hourly flow volume and peak rush hour detection.
   - Origin-Destination (OD) traffic matrix for city corridor analysis.
   - Interactive GIS Traffic Congestion Heatmap.

5. **Security, Watchlists & Alerts**:
   - Priority-tiered alert dispatch (Critical, High, Medium, Low).
   - Real-time watchlist hit notifications.
   - Privacy-by-design role-based access control (Admin, Traffic Officer, Traffic Analyst) and plate masking.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   CCTV Camera Nodes    │
                                  │ (CAM01 -> CAM05 Feeds) │
                                  └───────────┬────────────┘
                                              │ Video Streams / Uploads
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASTAPI BACKEND PIPELINE                                 │
│                                                                                        │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌──────────────────────────┐  │
│  │   Vehicle Detector    │──▶│    Plate Detector     │──▶│        OCR Engine        │  │
│  │ (YOLO / Demo Mock)    │   │ (Bounding Box Crop)   │   │(PaddleOCR / Conf Matrix) │  │
│  └───────────────────────┘   └───────────────────────┘   └────────────┬─────────────┘  │
│                                                                       │                │
│                                                                       ▼                │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌──────────────────────────┐  │
│  │ Trajectory Reconstruc-│◀──│ Plate Matcher & Fuzzy │◀──│ Plate Validator (MoRTH)  │  │
│  │ tion & GIS Engine     │   │ Typo Tolerance Engine │   │ (Standard & BH Series)   │  │
│  └───────────┬───────────┘   └───────────────────────┘   └──────────────────────────┘  │
│              │                                                                         │
│              ▼                                                                         │
│  ┌──────────────────────────────────────────────────┐                                  │
│  │ SQLAlchemy ORM (PostgreSQL / SQLite Zero-Config) │                                  │
│  └──────────────────────────────────────────────────┘                                  │
└──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                       │ REST APIs & Live WebSockets
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               REACT + VITE FRONTEND                                    │
│                                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Command Center   │  │ Camera Grid &    │  │ Vehicle Search & │  │ GIS Trajectory │  │
│  │ Live Dashboard   │  │ Stream Processor │  │ History Timeline │  │ Leaflet Map    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Traffic Volume   │  │ GIS Congestion   │  │ Real-Time Alert  │  │ Authorized     │  │
│  │ & Flow Analytics │  │ Intensity Heatmap│  │ Dispatch Center  │  │ Watchlist Hub  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Directory Structure

```
traffitrace-ai/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── anomaly_detector.py      # Route anomaly & speed violation detector
│   │   │   ├── ocr_engine.py            # OCR engine & character confusion handler
│   │   │   ├── plate_detector.py        # Number plate localization & crop
│   │   │   ├── plate_matcher.py         # Fuzzy Levenshtein OCR typo matcher
│   │   │   ├── plate_validator.py       # Indian MoRTH registration plate validator
│   │   │   ├── traffic_analyzer.py      # Traffic congestion level calculator
│   │   │   ├── trajectory_engine.py     # Spatiotemporal Haversine trajectory reconstructor
│   │   │   └── vehicle_detector.py      # Vehicle classifier (Car, Bike, Bus, Truck, Auto)
│   │   ├── models/                      # SQLAlchemy database models
│   │   ├── routes/                      # FastAPI REST API route handlers
│   │   ├── schemas/                     # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── demo_data_generator.py   # SIH 2026 realistic dataset seeder
│   │   │   └── live_feed_simulator.py   # Live WebSocket background ticker
│   │   ├── utils/                       # Direct bcrypt security & JWT authentication
│   │   ├── websocket/                   # WebSocket connection manager
│   │   ├── config.py                    # App configuration settings
│   │   ├── database.py                  # Database connection & session factory
│   │   └── main.py                      # FastAPI application entrypoint
│   ├── tests/
│   │   └── test_core.py                 # Pytest test suite for matching & kinematics
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx              # Leaflet GIS interactive map
│   │   │   ├── Navbar.jsx               # Top command bar with live pulse & clock
│   │   │   ├── Sidebar.jsx              # Dark blue smart city navigation
│   │   │   ├── StatCard.jsx             # Metric cards
│   │   │   └── TrajectoryTimeline.jsx   # Chronological step-by-step route card
│   │   ├── pages/
│   │   │   ├── Alerts.jsx               # Watchlist & speed alerts
│   │   │   ├── CameraManagement.jsx     # Camera node infrastructure CRUD
│   │   │   ├── CameraMonitoring.jsx     # Live CCTV video grid & processor
│   │   │   ├── Dashboard.jsx            # Main command center dashboard
│   │   │   ├── Login.jsx                # Secure login screen with SIH demo quick-fills
│   │   │   ├── Settings.jsx             # Privacy by design & audit log policies
│   │   │   ├── TrafficAnalytics.jsx     # Recharts modal split & OD traffic matrix
│   │   │   ├── TrafficMap.jsx           # GIS Traffic Congestion Heatmap
│   │   │   ├── TrajectoryMap.jsx        # Trajectory map reconstruction
│   │   │   ├── VehicleSearch.jsx        # Plate search & vehicle journey history
│   │   │   └── Watchlist.jsx            # Authorized demo watchlist manager
│   │   ├── services/
│   │   │   ├── api.js                   # Axios REST client with JWT interceptor
│   │   │   └── websocket.js             # Live WebSocket client
│   │   ├── styles/
│   │   │   └── index.css                # Smart City Command Center CSS system
│   │   ├── App.jsx                      # App router & layout container
│   │   └── main.jsx                     # React DOM entrypoint
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.10, 3.11, 3.12, 3.13)
- **Node.js 18+** & **npm**

---

### 2. Backend Setup & Run

```bash
# Navigate to backend directory
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Run pytest test suite to verify matching & trajectory algorithms
python -m pytest -v

# Start FastAPI backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> The backend will start on **http://localhost:8000**  
> Swagger API Documentation: **http://localhost:8000/docs**

---

### 3. Frontend Setup & Run

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite React development server
npm run dev
```
> Open your browser and navigate to **http://localhost:5173**

---

## 🔑 SIH Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@traffitrace.ai` | `Admin@123` | Full Access (CRUD Cameras, Watchlist, Trajectories) |
| **Traffic Officer** | `officer@traffitrace.ai` | `Officer@123` | Operational Access (Alerts, Trajectories, Searches) |
| **Traffic Analyst** | `analyst@traffitrace.ai` | `Analyst@123` | Aggregate Analytics & Flow Visualizations |

---

## 🎬 Smart India Hackathon Demo Presentation Scenario

Follow this exact walkthrough during your SIH jury presentation:

1. **Login**: Sign in as `admin@traffitrace.ai` with `Admin@123`.
2. **Command Center Overview**:
   - Note the **5 Active CCTV Nodes** on the city map.
   - Observe the **Live Real-Time ANPR Stream** updating every few seconds via WebSockets.
3. **Multi-Camera Vehicle Search**:
   - Go to **Vehicle Search** (`/search`) or **Trajectory Tracking** (`/trajectory`).
   - Search for standard SIH demo target: **`TN31AB4589`**.
4. **Trajectory Reconstruction with OCR Typo Tolerance**:
   - Point out how `TN31AB4589` is detected chronologically:
     1. **CAM01** (Railway Station Main Gate) at `09:10 AM`
     2. **CAM02** (Central Bus Terminus) at `09:17 AM`
     3. **CAM03** (Gandhi Road Junction) at `09:28 AM` with raw OCR reading **`TN31A84589`** (Number `8` mistaken for `B`).
     4. **CAM05** (Airport Expressway Toll) at `09:45 AM`
   - Show that the AI Matcher automatically flags `TN31A84589` as a **Probable Match** (93% confidence) and reconstructs the continuous 4.7 km route!
5. **GIS Trajectory Map**:
   - Open **Trajectory Tracking** to see the route plotted with directional polylines and numbered waypoint chips on Leaflet OpenStreetMap.
6. **Traffic Heatmap & Analytics**:
   - Open **Traffic Heatmap** (`/traffic-map`) to visualize density circles around Bus Stand and Main Road.
   - Open **Traffic Analytics** (`/analytics`) to present the hourly traffic curve, modal breakdown, and the **Origin-Destination (OD) Matrix**.
7. **Watchlist & Live Alerts**:
   - Add a new vehicle to the **Watchlist** (`/watchlist`).
   - Observe real-time toast alert popups and badge counters in the top navigation bar.

---

## 🔒 Privacy by Design & Security

1. **Role-Based Access Control (RBAC)**: Strict segregation between high-level aggregate traffic statistics and granular vehicle tracking.
2. **Number Plate Masking**: Data anonymization for public dashboard views and analyst roles.
3. **Configurable Retention**: Configurable data purging policies for historical video clips and plate crops.
4. **Audit Trail**: Every watchlist modification and trajectory query is logged with timestamps.

---

## 🏆 SIH Hackathon Evaluation Mapping

| Hackathon Criterion | TraffiTrace AI Solution |
| :--- | :--- |
| **Problem Statement 26127** | End-to-end multi-camera ANPR vehicle tracking & traffic analytics. |
| **Innovation & AI** | Dual-layer matching (Normalized Exact + Weighted Levenshtein OCR Typo Tolerance + Kinematic Spatiotemporal Feasibility). |
| **Robustness & Reliability** | `DEMO_MODE=true` ensures flawless live demo presentation without external camera hardware dependencies. |
| **UI / UX Command Center** | Smart City Command Centre design system with dark navy sidebar, crisp metric cards, interactive Leaflet GIS maps, and Recharts analytics. |
| **Code Modularity** | Clean separation of AI engine, REST routes, ORM models, Pydantic schemas, and WebSocket brokers. |

---

*Developed for Smart India Hackathon 2026 • Problem Statement 26127*
