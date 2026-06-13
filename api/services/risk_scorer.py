import math

BLACKSPOTS = [
    {"name": "Sikar", "lat": 27.6094, "lon": 75.1399, "weight": 30},
    {"name": "Kota", "lat": 25.2138, "lon": 75.8648, "weight": 25},
    {"name": "Patna", "lat": 25.6093, "lon": 85.1376, "weight": 20},
]

PAST_LEAK_STATES = {"Rajasthan": 3, "Bihar": 2, "Maharashtra": 2, "Uttar Pradesh": 2}

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))

def calculate_risk_score(
    state: str,
    center_age_years: float = 5.0,
    owner_multiple_centers: bool = False,
    latitude: float = 0.0,
    longitude: float = 0.0,
) -> dict:
    score = 0
    reasons = []

    past_leaks = PAST_LEAK_STATES.get(state, 0)
    if past_leaks >= 3:
        score += 20
        reasons.append(f"{state} has {past_leaks}+ past leak incidents")
    elif past_leaks >= 2:
        score += 10
        reasons.append(f"{state} has {past_leaks} past leak incidents")

    if center_age_years < 2:
        score += 15
        reasons.append(f"Center is only {center_age_years} years old (new center risk)")

    if owner_multiple_centers:
        score += 10
        reasons.append("Owner operates multiple centers")

    min_distance = float("inf")
    nearest_blackspot = ""
    for spot in BLACKSPOTS:
        dist = haversine(latitude, longitude, spot["lat"], spot["lon"])
        if dist < min_distance:
            min_distance = dist
            nearest_blackspot = spot["name"]

    if min_distance < 50:
        score += 25
        reasons.append(f"Within {min_distance:.0f}km of known blackspot ({nearest_blackspot})")
    elif min_distance < 100:
        score += 10
        reasons.append(f"Within {min_distance:.0f}km of known blackspot ({nearest_blackspot})")

    score = min(score, 100)

    if score >= 70:
        level = "BLOCK"
    elif score >= 40:
        level = "FLAG"
    elif score >= 20:
        level = "MONITOR"
    else:
        level = "PASS"

    return {"score": score, "level": level, "reasons": reasons}
