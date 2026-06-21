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
    assert response.json()["cv"]["prediction"] == "early_blight"
    assert farm.observed[2][3] == 0.7


def test_cv_rejects_non_image() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/cv/predict", files={"file": ("notes.txt", b"not an image", "text/plain")}
        )
    assert response.status_code == 415
