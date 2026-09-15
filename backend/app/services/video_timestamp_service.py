"""
Video Timestamp Service
Calculates precise absolute timestamps for every extracted video frame:
absolute_timestamp = video_start_datetime + timedelta(seconds=video_timestamp_seconds)
"""
from datetime import datetime, timedelta
import logging

logger = logging.getLogger("traffitrace.services.video_timestamp")

def parse_start_datetime(video_date: str, video_start_time: str) -> datetime:
    """
    Parses date (YYYY-MM-DD) and time (HH:MM:SS or HH:MM) into a unified datetime object.
    Falls back gracefully to current date/time if parsing fails.
    """
    try:
        clean_date = (video_date or "2026-09-09").strip()
        clean_time = (video_start_time or "09:00:00").strip()
        
        # Normalize HH:MM -> HH:MM:00
        if len(clean_time) == 5:
            clean_time += ":00"
            
        full_str = f"{clean_date} {clean_time}"
        return datetime.strptime(full_str, "%Y-%m-%d %H:%M:%S")
    except Exception as e:
        logger.warning(f"Error parsing datetime '{video_date}' '{video_start_time}': {e}. Using current UTC.")
        return datetime.utcnow()

def compute_absolute_timestamp(base_datetime: datetime, video_timestamp_seconds: float) -> datetime:
    """
    Returns exact real-world absolute datetime for a vehicle sighting in the video.
    """
    return base_datetime + timedelta(seconds=max(0.0, float(video_timestamp_seconds)))

def format_video_time_str(seconds: float) -> str:
    """
    Formats seconds into standard HH:MM:SS string for user displays.
    """
    total_secs = int(seconds)
    hours = total_secs // 3600
    minutes = (total_secs % 3600) // 60
    secs = total_secs % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
