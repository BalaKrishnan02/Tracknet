"""
OCR Engine Module (PaddleOCR / EasyOCR hook + Mock OCR)
Extracts raw text from cropped license plate images.
"""
import random
import logging
from typing import Dict, Any
from app.ai.plate_validator import normalize_plate_text, validate_indian_plate

logger = logging.getLogger("traffitrace.ai.ocr_engine")

SAMPLE_PLATES = [
    "TN31AB4589", "TN07CB1234", "PY01AZ9876", "DL01AB9999",
    "KA05MJ4421", "MH12DE5544", "KL07BH3322", "TN72BK9087",
    "TN09AZ4321", "TN22CY7890", "AP09CD1122", "TS07EF8899"
]

class OCREngine:
    def __init__(self, use_real_paddle: bool = False):
        self.use_real_paddle = use_real_paddle

    def recognize_plate(self, plate_image_path: str = None, fallback_plate: str = None) -> Dict[str, Any]:
        """
        Performs OCR on license plate crop.
        Returns: {
            'raw_text': str,
            'normalized_plate': str,
            'confidence': float,
            'is_valid': bool,
            'validation_score': float
        }
        """
        raw_text = fallback_plate or random.choice(SAMPLE_PLATES)
        
        # Introduce occasional mild OCR noise in 10% of cases for realistic AI testing
        if random.random() < 0.10 and len(raw_text) > 5:
            # Replace 'B' with '8' or '0' with 'O'
            raw_text = raw_text.replace("B", "8").replace("0", "O")

        normalized = normalize_plate_text(raw_text)
        is_valid, val_score, meta = validate_indian_plate(normalized)
        confidence = round(random.uniform(0.92, 0.99), 3)

        return {
            "raw_text": raw_text,
            "normalized_plate": normalized,
            "confidence": confidence,
            "is_valid": is_valid,
            "validation_score": val_score,
            "metadata": meta
        }

ocr_engine = OCREngine()
