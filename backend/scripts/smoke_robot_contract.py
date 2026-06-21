"""Print one real robot visit response for handoff verification."""

import json
from pathlib import Path

from fastapi.testclient import TestClient

import farm
from main import app

SAMPLE_IMAGE = Path(__file__).resolve().parents[1] / "tests" / "sample_early_blight.jpg"


def main() -> None:
    farm.reset()
    with TestClient(app) as client, SAMPLE_IMAGE.open("rb") as image:
        response = client.post(
            "/farm/visit/image?row=2&col=3",
            files={"file": (SAMPLE_IMAGE.name, image, "image/jpeg")},
        )
        response.raise_for_status()
        result = response.json()
        grid_score = client.get("/farm/grid").json()["grid"][2][3]

    if grid_score != result["beliefRisk"]:
        raise RuntimeError("Robot response and observed grid do not agree.")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

