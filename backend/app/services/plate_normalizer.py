"""
Plate Normalizer Service
Sanitizes raw OCR text and manual user search inputs into standardized registration plates.
Example: 'tn 31-ab 4589' -> 'TN31AB4589'
"""
import re
from typing import Tuple

def normalize_plate(raw_text: str) -> str:
    """
    Cleans all whitespace, punctuation, dashes, dots and converts to uppercase.
    """
    if not raw_text:
        return ""
    # Strip non-alphanumeric characters
    cleaned = re.sub(r"[^a-zA-Z0-9]", "", str(raw_text)).upper()
    return cleaned

def clean_ocr_for_display(plate: str) -> str:
    """
    Inserts standard spacing for clean Indian plate formatting (e.g. TN 31 AB 4589).
    """
    p = normalize_plate(plate)
    if len(p) == 10 and p[:2].isalpha() and p[2:4].isdigit() and p[4:6].isalpha() and p[6:10].isdigit():
        return f"{p[:2]} {p[2:4]} {p[4:6]} {p[6:]}"
    elif len(p) == 9 and p[:2].isalpha() and p[2:4].isdigit() and p[4:5].isalpha() and p[5:9].isdigit():
        return f"{p[:2]} {p[2:4]} {p[4:5]} {p[5:]}"
    return p
