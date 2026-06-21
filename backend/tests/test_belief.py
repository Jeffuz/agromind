import pytest

from belief import update_belief
from farm import plant_id_for


def test_confident_prediction_uses_severity() -> None:
    assert update_belief(severity=0.9, confidence=1.0) == (0.9, 0.0)


def test_uncertain_prediction_stays_near_prior() -> None:
    assert update_belief(severity=0.9, confidence=0.0) == (0.3, 1.0)


def test_belief_blends_prediction_and_prior() -> None:
    assert update_belief(severity=0.7, confidence=0.8) == (0.62, 0.2)


@pytest.mark.parametrize("value", [-0.01, 1.01])
def test_belief_rejects_values_outside_probability_range(value: float) -> None:
    with pytest.raises(ValueError):
        update_belief(severity=value, confidence=0.8)


def test_plant_id_is_deterministic() -> None:
    assert plant_id_for(2, 3) == "plant_02_03"
