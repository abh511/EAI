from app.api.routes.site_analysis import CONSTRUCTION_REQUIREMENTS, calculate_suitability
from app.services import load_data


def _location_average(location: str) -> dict:
    df = load_data()
    rows = df[df["location"] == location]
    return {**rows.mean(numeric_only=True).to_dict(), "zone_type": rows["zone_type"].iloc[0]}


def test_hospital_possible_in_cleanest_area_but_not_most_polluted():
    hospital = CONSTRUCTION_REQUIREMENTS["hospital"]
    assert calculate_suitability(_location_average("Malabar Hill"), hospital)[0] >= 60
    assert calculate_suitability(_location_average("Dharavi"), hospital)[0] < 30


def test_partial_credit_rewards_values_close_to_the_limit():
    req = {"aqi_max": 100}
    near, _, _ = calculate_suitability({"aqi_us": 110}, req)
    far, _, _ = calculate_suitability({"aqi_us": 300}, req)
    assert near == 80  # 10% over a limit with 50% tolerance keeps 80% credit
    assert far == 0


def test_night_noise_requirement_is_checked():
    req = CONSTRUCTION_REQUIREMENTS["old_age_home"]
    _, violations, checks = calculate_suitability(_location_average("Dharavi"), req)
    assert "night_noise" in checks
    assert any(v["factor"] == "Night-time Noise" for v in violations)


def test_factory_blocked_in_residential_zone():
    factory = CONSTRUCTION_REQUIREMENTS["factory"]
    score, violations, _ = calculate_suitability(_location_average("Kothrud"), factory)  # Dense Residential
    assert score < 60
    assert any(v["factor"] == "Residential Proximity" for v in violations)
    assert calculate_suitability(_location_average("Pimpri-Chinchwad"), factory)[0] >= 60  # Heavy Industrial
