"""
Frame Processor Service
Provides a common VideoSource abstraction for both Uploaded Video files and future RTSP CCTV streams.
Handles OpenCV frame sampling, deduplication, and plate image preprocessing.
"""
import os
import cv2
import numpy as np
import logging
from typing import Generator, Tuple, Optional, Dict, Any

logger = logging.getLogger("traffitrace.services.frame_processor")

class BaseVideoSource:
    """Common input interface for both offline video files and real-time CCTV streams."""
    def open(self) -> bool:
        raise NotImplementedError
    def read_frame(self) -> Tuple[bool, Optional[np.ndarray], int, float]:
        raise NotImplementedError
    def release(self):
        raise NotImplementedError
    def get_metadata(self) -> Dict[str, Any]:
        raise NotImplementedError

class UploadedVideoSource(BaseVideoSource):
    """Offline uploaded CCTV video processor using OpenCV VideoCapture."""
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.cap: Optional[cv2.VideoCapture] = None
        self.fps = 30.0
        self.total_frames = 0
        self.duration_seconds = 0.0
        self.width = 1920
        self.height = 1080

    def open(self) -> bool:
        if not os.path.exists(self.file_path):
            logger.error(f"Video file not found: {self.file_path}")
            return False
        self.cap = cv2.VideoCapture(self.file_path)
        if not self.cap.isOpened():
            logger.error(f"Failed to open video file: {self.file_path}")
            return False

        self.fps = max(1.0, self.cap.get(cv2.CAP_PROP_FPS) or 30.0)
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920)
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)
        self.duration_seconds = round(self.total_frames / self.fps, 2) if self.fps else 0.0
        return True

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "fps": round(self.fps, 2),
            "total_frames": self.total_frames,
            "duration_seconds": self.duration_seconds,
            "width": self.width,
            "height": self.height
        }

    def sample_frames(self, sample_step: int = 3) -> Generator[Tuple[int, float, np.ndarray], None, None]:
        """
        Extracts sampled frames to optimize prototype inference without CPU overload.
        Yields: (frame_number, video_timestamp_seconds, frame_bgr)
        """
        if not self.cap or not self.cap.isOpened():
            return

        frame_idx = 0
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            if frame_idx % sample_step == 0:
                sec = round(frame_idx / self.fps, 2)
                yield frame_idx, sec, frame
            
            frame_idx += 1

    def release(self):
        if self.cap:
            self.cap.release()
            self.cap = None

class RTSPVideoSource(BaseVideoSource):
    """
    Authorized live CCTV stream reader (RTSP/RTMP/HLS).
    Credentials stored exclusively on backend; never exposed to frontend clients.
    """
    def __init__(self, stream_url: str):
        self.stream_url = stream_url
        self.cap: Optional[cv2.VideoCapture] = None

    def open(self) -> bool:
        # Prepares authenticated connection with timeout
        os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;udp|timeout;5000000"
        self.cap = cv2.VideoCapture(self.stream_url, cv2.CAP_FFMPEG)
        return self.cap.isOpened() if self.cap else False

    def read_frame(self) -> Tuple[bool, Optional[np.ndarray], int, float]:
        if not self.cap or not self.cap.isOpened():
            return False, None, 0, 0.0
        ret, frame = self.cap.read()
        return ret, frame, 0, 0.0

    def release(self):
        if self.cap:
            self.cap.release()
            self.cap = None

    def get_metadata(self) -> Dict[str, Any]:
        return {"type": "LIVE_CCTV_RTSP", "status": "CONNECTED" if self.cap and self.cap.isOpened() else "DISCONNECTED"}


def preprocess_plate_image(plate_crop: np.ndarray) -> np.ndarray:
    """
    Applies non-destructive OCR enhancement:
    1. Grayscale conversion
    2. Adaptive CLAHE contrast enhancement
    3. Bilateral filter for noise reduction
    4. Otsu's binarization / sharpening
    """
    if plate_crop is None or plate_crop.size == 0:
        return plate_crop

    try:
        # Resize if small
        h, w = plate_crop.shape[:2]
        if h < 60:
            scale = 60.0 / h
            plate_crop = cv2.resize(plate_crop, (int(w * scale), 60), interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        denoised = cv2.bilateralFilter(enhanced, 9, 75, 75)
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh
    except Exception as e:
        logger.warning(f"Error preprocessing plate image: {e}")
        return plate_crop
