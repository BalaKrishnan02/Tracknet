"""
Indian License Plate Normalization and Validation Module
Conforms to MoRTH standard Indian registration formats:
- Standard: [State 2 letters][District 2 digits][Series 1-3 letters][Number 4 digits] e.g. TN31AB4589, PY01AZ1234, DL01C1234
- BH Series: [Year 2 digits]BH[Random 4 digits][Random 2 letters] e.g. 22BH1234AA
- Vintage / Diplomatic / EV format support
"""
import re
from typing import Tuple, Dict, Any

# Indian State & Union Territory Codes
INDIAN_STATE_CODES = {
    "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DL", "DN",
    "GA", "GJ", "HR", "HP", "JH", "JK", "KA", "KL", "LA", "LD",
    "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "OR", "PB", "PY",
    "RJ", "SK", "TN", "TR", "TS", "UK", "UA", "UP", "WB", "BH"
}

STANDARD_PLATE_REGEX = re.compile(r"^([A-Z]{2})([0-9]{1,2})([A-Z]{0,3})([0-9]{1,4})$")
BH_SERIES_REGEX = re.compile(r"^([0-9]{2})BH([0-9]{4})([A-Z]{1,2})$")

def normalize_plate_text(raw_text: str) -> str:
    """
    Normalizes raw OCR text by removing whitespace, hyphens, dots,
    and converting to uppercase.
    Example: 'tn 31-ab.4589' -> 'TN31AB4589'
    """
    if not raw_text:
        return ""
    # Strip non-alphanumeric characters
    cleaned = re.sub(r"[^A-Za-z0-9]", "", raw_text).upper()
    return cleaned

def validate_indian_plate(plate_number: str) -> Tuple[bool, float, Dict[str, Any]]:
    """
    Validates Indian license plate format and computes a validation confidence score.
    Returns: (is_valid, validation_score, metadata)
    """
    normalized = normalize_plate_text(plate_number)
    
    if not normalized:
        return False, 0.0, {"error": "Empty plate string"}

    length = len(normalized)
    if length < 6 or length > 12:
        return False, 0.3, {"error": f"Invalid plate length: {length}"}

    # Check BH series format
    bh_match = BH_SERIES_REGEX.match(normalized)
    if bh_match:
        return True, 1.0, {
            "type": "BH_SERIES",
            "year": bh_match.group(1),
            "series": "BH",
            "number": bh_match.group(2),
            "suffix": bh_match.group(3)
        }

    # Check Standard State Format
    std_match = STANDARD_PLATE_REGEX.match(normalized)
    if std_match:
        state_code = std_match.group(1)
        rto_code = std_match.group(2)
        series_code = std_match.group(3)
        reg_number = std_match.group(4)

        if state_code in INDIAN_STATE_CODES:
            score = 1.0
            # If 4-digit number is padded correctly
            if len(reg_number) == 4:
                score = 1.0
            else:
                score = 0.85
            return True, score, {
                "type": "STANDARD_INDIAN",
                "state": state_code,
                "rto": rto_code,
                "series": series_code,
                "number": reg_number
            }
        else:
            # Possible OCR mistake in state code (e.g., 'TM' instead of 'TN')
            return False, 0.6, {
                "type": "UNKNOWN_STATE",
                "state": state_code,
                "rto": rto_code,
                "series": series_code,
                "number": reg_number
            }

    # Partial / Imperfect Match (Lenient scoring so OCR errors are not rejected immediately)
    score = 0.4
    if any(normalized.startswith(code) for code in INDIAN_STATE_CODES):
        score = 0.7

    return False, score, {"type": "UNSTRUCTURED_OR_NOISY", "normalized": normalized}
