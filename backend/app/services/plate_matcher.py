"""
Plate Matcher Service
Implements weighted Levenshtein distance with OCR character confusion penalties
and classifies matches into EXACT, PROBABLE, LOW CONFIDENCE, and REJECT.
"""
from typing import Tuple, Dict, Any
from app.services.plate_normalizer import normalize_plate

OCR_CONFUSION_PAIRS = {
    ("8", "B"), ("B", "8"),
    ("0", "O"), ("O", "0"),
    ("0", "D"), ("D", "0"),
    ("0", "Q"), ("Q", "0"),
    ("1", "I"), ("I", "1"),
    ("1", "L"), ("L", "1"),
    ("5", "S"), ("S", "5"),
    ("2", "Z"), ("Z", "2"),
    ("6", "G"), ("G", "6"),
    ("4", "A"), ("A", "4"),
    ("8", "S"), ("S", "8"),
    ("V", "U"), ("U", "V")
}

def ocr_char_distance(c1: str, c2: str) -> float:
    if c1 == c2:
        return 0.0
    if (c1, c2) in OCR_CONFUSION_PAIRS:
        return 0.3  # Reduced penalty for known visual OCR mistakes
    return 1.0

def weighted_levenshtein(s1: str, s2: str) -> float:
    """
    Computes weighted distance between two plate strings.
    """
    if s1 == s2:
        return 0.0
    if not s1:
        return float(len(s2))
    if not s2:
        return float(len(s1))

    n, m = len(s1), len(s2)
    dp = [[0.0] * (m + 1) for _ in range(n + 1)]

    for i in range(n + 1):
        dp[i][0] = float(i)
    for j in range(m + 1):
        dp[0][j] = float(j)

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = ocr_char_distance(s1[i - 1], s2[j - 1])
            dp[i][j] = min(
                dp[i - 1][j] + 1.0,
                dp[i][j - 1] + 1.0,
                dp[i - 1][j - 1] + cost
            )

    return dp[n][m]

def compute_plate_similarity(target_plate: str, candidate_plate: str) -> float:
    """
    Computes similarity percentage [0.0 - 100.0] between two plates.
    """
    t = normalize_plate(target_plate)
    c = normalize_plate(candidate_plate)
    if not t or not c:
        return 0.0
    if t == c:
        return 100.0

    max_len = max(len(t), len(c))
    dist = weighted_levenshtein(t, c)
    sim = max(0.0, 1.0 - (dist / max_len)) * 100.0
    return round(sim, 1)

def classify_match(
    target_plate: str,
    detected_plate: str,
    ocr_confidence: float = 0.95,
    exact_threshold: float = 100.0,
    probable_threshold: float = 85.0,
    review_threshold: float = 70.0
) -> Dict[str, Any]:
    """
    Evaluates similarity, blends OCR confidence, and categorizes match:
    - EXACT MATCH: 100% normalized string identity
    - PROBABLE MATCH: >= 85% similarity
    - LOW CONFIDENCE / REVIEW: 70% - 84% similarity
    - REJECT: < 70% similarity
    """
    t_clean = normalize_plate(target_plate)
    d_clean = normalize_plate(detected_plate)

    if t_clean == d_clean:
        return {
            "match_type": "EXACT MATCH",
            "is_match": True,
            "plate_similarity": 100.0,
            "match_confidence": 100.0,
            "requires_review": False
        }

    sim = compute_plate_similarity(t_clean, d_clean)
    
    # Blended score with OCR confidence (70% string similarity + 30% OCR reliability)
    blended = round((sim * 0.70) + (min(100.0, ocr_confidence * 100.0) * 0.30), 1)

    if sim >= probable_threshold:
        match_type = "PROBABLE MATCH"
        is_match = True
        requires_review = True
    elif sim >= review_threshold:
        match_type = "LOW CONFIDENCE"
        is_match = False  # Held for operator review
        requires_review = True
    else:
        match_type = "REJECT"
        is_match = False
        requires_review = False

    return {
        "match_type": match_type,
        "is_match": is_match,
        "plate_similarity": sim,
        "match_confidence": blended,
        "requires_review": requires_review
    }
