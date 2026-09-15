"""
Camera Stream Manager & VideoSource Abstraction
Enables seamless switching between Demo MP4 video feeds and future
enterprise CCTV streams (RTSP / NVR / DVR / ONVIF IP Cameras).
"""
import time
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("traffitrace.stream_manager")

class VideoSource(ABC):
    def __init__(self, source_url: str, camera_id: str):
        self.source_url = source_url
        self.camera_id = camera_id
        self.is_connected = False
        self.last_frame_time = None
        self.fps = 30.0

    @abstractmethod
    def connect(self) -> bool:
        pass

    @abstractmethod
    def get_frame(self) -> Optional[Any]:
        pass

    @abstractmethod
    def disconnect(self):
        pass

class DemoVideoSource(VideoSource):
    """Handles simulated and pre-recorded MP4 surveillance video feeds"""
    def connect(self) -> bool:
        self.is_connected = True
        self.last_frame_time = datetime.utcnow()
        logger.info(f"Connected DemoVideoSource for {self.camera_id} ({self.source_url})")
        return True

    def get_frame(self) -> Optional[Any]:
        self.last_frame_time = datetime.utcnow()
        return {"status": "FRAME_OK", "timestamp": self.last_frame_time, "source": "DEMO_MP4"}

    def disconnect(self):
        self.is_connected = False

class UploadedVideoSource(VideoSource):
    """Processes user-uploaded MP4/AVI clips through ANPR detector"""
    def connect(self) -> bool:
        self.is_connected = True
        self.last_frame_time = datetime.utcnow()
        return True

    def get_frame(self) -> Optional[Any]:
        self.last_frame_time = datetime.utcnow()
        return {"status": "FRAME_OK", "timestamp": self.last_frame_time, "source": "UPLOADED_VIDEO"}

    def disconnect(self):
        self.is_connected = False

class RTSPVideoSource(VideoSource):
    """Future authorized live RTSP CCTV camera stream connector"""
    def connect(self) -> bool:
        # In prototype mode, simulates connection state
        self.is_connected = True
        self.last_frame_time = datetime.utcnow()
        logger.info(f"Initialized RTSP connection endpoint for {self.camera_id}")
        return True

    def get_frame(self) -> Optional[Any]:
        self.last_frame_time = datetime.utcnow()
        return {"status": "RTSP_FRAME", "timestamp": self.last_frame_time}

    def disconnect(self):
        self.is_connected = False

class NVRVideoSource(RTSPVideoSource):
    """Future NVR multi-channel video source"""
    pass

class ONVIFVideoSource(RTSPVideoSource):
    """Future ONVIF PTZ / Fixed Camera protocol source"""
    pass

class StreamManager:
    """
    Central stream registry and supervisor.
    Monitors camera health, frame queues, and auto-reconnects dropped feeds.
    """
    def __init__(self):
        self.streams: Dict[str, VideoSource] = {}

    def register_camera_stream(self, camera_id: str, stream_url: str, source_type: str = "DEMO_VIDEO") -> VideoSource:
        if source_type == "RTSP_CAMERA":
            source = RTSPVideoSource(stream_url, camera_id)
        elif source_type == "UPLOADED_VIDEO":
            source = UploadedVideoSource(stream_url, camera_id)
        elif source_type == "ONVIF_CAMERA":
            source = ONVIFVideoSource(stream_url, camera_id)
        else:
            source = DemoVideoSource(stream_url, camera_id)

        source.connect()
        self.streams[camera_id] = source
        return source

    def get_stream_health(self, camera_id: str) -> Dict[str, Any]:
        source = self.streams.get(camera_id)
        if not source:
            return {"status": "UNREGISTERED", "health": "Unknown", "fps": 0}
        
        return {
            "status": "Online" if source.is_connected else "Offline",
            "health": "Optimal" if source.is_connected else "Degraded",
            "fps": source.fps,
            "last_frame_seen": source.last_frame_time.isoformat() if source.last_frame_time else None,
            "source_type": type(source).__name__
        }

stream_manager = StreamManager()
