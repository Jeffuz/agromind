from pathlib import Path

from fastapi.testclient import TestClient

import farm
from main import app

BACKEND_DIR = Path(__file__).resolve().parents[1]
SAMPLE_IMAGE = BACKEND_DIR / "tests" / "sample_early_blight.jpg"


def test_cv_health() -> None:
    with TestClient(app) as client:
        response = client.get("/cv/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_cv_prediction() -> None:
    with TestClient(app) as client, SAMPLE_IMAGE.open("rb") as image:
        response = client.post(
            "/cv/predict",
            data={"plantId": "plant_042"},
            files={"file": (SAMPLE_IMAGE.name, image, "image/jpeg")},
        )
    assert response.status_code == 200
    result = response.json()
    assert result["plantId"] == "plant_042"
    assert result["prediction"] == "early_blight"
    assert 0.0 <= result["confidence"] <= 1.0
    assert result["severity"] == 0.7


def test_image_visit_updates_observed_grid() -> None:
    farm.reset()
    with TestClient(app) as client, SAMPLE_IMAGE.open("rb") as image:
        response = client.post(
            "/farm/visit/image?row=2&col=3",
            files={"file": (SAMPLE_IMAGE.name, image, "image/jpeg")},
        )
    assert response.status_code == 200
    result = response.json()
    assert result["plantId"] == "plant_02_03"
    assert result["cv"]["plantId"] == "plant_02_03"
    assert result["cv"]["prediction"] == "early_blight"
    expected_risk = round(0.7 * result["cv"]["confidence"] + 0.3 * result["uncertainty"], 4)
    assert result["beliefRisk"] == expected_risk
    assert farm.observed[2][3] == expected_risk
    assert result["nextRecommended"]["action"] in {"UP", "DOWN", "LEFT", "RIGHT"}


def test_robot_visit_contract_and_grid_flow() -> None:
    with TestClient(app) as client:
        assert client.post("/farm/reset").status_code == 200
        assert client.get("/farm/grid").json()["grid"][4][5] is None

        with SAMPLE_IMAGE.open("rb") as image:
            first = client.post(
                "/farm/visit/image?row=4&col=5",
                files={"file": (SAMPLE_IMAGE.name, image, "image/jpeg")},
            )
        first_result = first.json()
        assert first.status_code == 200
        assert first_result["visited"] == [4, 5]
        assert first_result["alreadyVisited"] is False
        assert first_result["allDone"] is False
        assert client.get("/farm/grid").json()["grid"][4][5] == first_result["beliefRisk"]

        with SAMPLE_IMAGE.open("rb") as image:
            second = client.post(
                "/farm/visit/image?row=4&col=5",
                files={"file": (SAMPLE_IMAGE.name, image, "image/jpeg")},
            )
        assert second.status_code == 200
        second_result = second.json()
        assert second_result["alreadyVisited"] is True
        assert second_result["priorRisk"] == first_result["beliefRisk"]


def test_cv_rejects_non_image() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/cv/predict", files={"file": ("notes.txt", b"not an image", "text/plain")}
        )
    assert response.status_code == 415
