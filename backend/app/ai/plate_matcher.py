"""
Plate Matcher & OCR Typos Tolerance Engine
Implements Levenshtein distance with domain-specific character confusion penalty:
- Number 8 <-> Letter B
- Number 0 <-> Letter O / D
- Number 1 <-> Letter I / L
- Number 5 <-> Letter S
- Number 2 <-> Letter Z
- Number 6 <-> Letter G
"""
from typing import Tuple

# Common OCR confusion pairs with lower substitution penalty (0.3 instead of 1.0)
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
        return 0.3  # Mild OCR confusion
    return 1.0

def weighted_levenshtein_similarity(s1: str, s2: str) -> float:
    """
    Computes weighted similarity score between two normalized plate numbers [0.0 - 1.0].
    """
    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0

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
                dp[i - 1][j] + 1.0,        # deletion
                dp[i][j - 1] + 1.0,        # insertion
                dp[i - 1][j - 1] + cost    # substitution
            )

    max_len = max(n, m)
    dist = dp[n][m]
    similarity = max(0.0, 1.0 - (dist / max_len))
    return round(similarity, 4)

def calculate_vehicle_similarity(vtype1: str, vcolor1: str, vtype2: str, vcolor2: str) -> float:
    score = 0.0
    if vtype1 and vtype2 and vtype1.lower() == vtype2.lower():
        score += 0.6
    elif vtype1 and vtype2 and ("car" in vtype1.lower() or "suv" in vtype1.lower()) and ("car" in vtype2.lower() or "suv" in vtype2.lower()):
        score += 0.4

    if vcolor1 and vcolor2 and vcolor1.lower() == vcolor2.lower():
        score += 0.4
    elif not vcolor1 or not vcolor2:
        score += 0.2

    return score

def match_plates(
    query_plate: str,
    target_plate: str,
    query_type: str = "Car",
    query_color: str = "White",
    target_type: str = "Car",
    target_color: str = "White",
    time_feasibility_score: float = 1.0
) -> Tuple[str, float, dict]:
    """
    Returns (match_classification, combined_confidence, breakdown)
    Classifications: 'Exact Match', 'Probable Match', 'Needs Review', 'No Match'
    """
    if query_plate == target_plate:
        return "Exact Match", 1.0, {
            "plate_similarity": 1.0,
            "vehicle_similarity": 1.0,
            "time_feasibility": time_feasibility_score,
            "combined": 1.0
        }

    plate_sim = weighted_levenshtein_similarity(query_plate, target_plate)
    veh_sim = calculate_vehicle_similarity(query_type, query_color, target_type, target_color)
    
    # Combined score calculation
    # Example: Plate similarity 88% (0.60 weight), Vehicle similarity 94% (0.20 weight), Time feasibility 97% (0.20 weight)
    combined = (plate_sim * 0.65) + (veh_sim * 0.15) + (time_feasibility_score * 0.20)
    combined = round(min(1.0, max(0.0, combined)), 3)

    breakdown = {
        "plate_similarity": round(plate_sim, 3),
        "vehicle_similarity": round(veh_sim, 3),
        "time_feasibility": round(time_feasibility_score, 3),
        "combined": combined
    }

    if plate_sim >= 0.85 and combined >= 0.80:
        return "Probable Match", combined, breakdown
    elif plate_sim >= 0.70 and combined >= 0.65:
        return "Needs Review", combined, breakdown
    else:
        return "No Match", combined, breakdown
