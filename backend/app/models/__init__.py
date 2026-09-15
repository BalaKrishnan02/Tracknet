from app.models.user import User
from app.models.camera import Camera
from app.models.detection import VehicleDetection
from app.models.video import CameraVideo
from app.models.trajectory import Trajectory, TrajectoryPoint
from app.models.watchlist import Watchlist
from app.models.alert import Alert
from app.models.traffic import TrafficStatistic
from app.models.location import State, City, Zone

__all__ = [
    "User",
    "Camera",
    "VehicleDetection",
    "CameraVideo",
    "Trajectory",
    "TrajectoryPoint",
    "Watchlist",
    "Alert",
    "TrafficStatistic",
    "State",
    "City",
    "Zone",
]
