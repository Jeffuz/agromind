"""Tomato disease inference used by the AgroMind backend."""

import json
import os
import threading
from functools import lru_cache
from io import BytesIO
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image, UnidentifiedImageError

BACKEND_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(
    os.getenv("AGROMIND_CV_MODEL_PATH", BACKEND_DIR / "models" / "agromind_mobilenetv2.keras")
)
CLASS_NAMES_PATH = Path(
    os.getenv("AGROMIND_CV_CLASSES_PATH", BACKEND_DIR / "models" / "class_names.json")
)
IMAGE_SIZE = (224, 224)

LABEL_MAP = {
    "Tomato___healthy": "healthy",
    "Tomato___Early_blight": "early_blight",
    "Tomato___Late_blight": "late_blight",
    "Tomato___Leaf_Mold": "leaf_mold",
}

# Simulation risk proxies; these are not measurements of lesion coverage.
SEVERITY_MAP = {
    "healthy": 0.0,
    "leaf_mold": 0.55,
    "early_blight": 0.70,
    "late_blight": 0.90,
}

_INFERENCE_LOCK = threading.Lock()


class ModelUnavailableError(RuntimeError):
    """Raised when the packaged CV artifacts cannot be loaded."""


@lru_cache(maxsize=1)
def load_artifacts() -> tuple[tf.keras.Model, list[str]]:
    if not MODEL_PATH.is_file() or not CLASS_NAMES_PATH.is_file():
        raise ModelUnavailableError(
            "CV artifacts are missing. Expected backend/models/agromind_mobilenetv2.keras "
            "and backend/models/class_names.json."
        )

    try:
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        class_names = json.loads(CLASS_NAMES_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise ModelUnavailableError(f"Could not load CV artifacts: {error}") from error

    if not isinstance(class_names, list) or model.output_shape[-1] != len(class_names):
        raise ModelUnavailableError("Model outputs do not match class_names.json.")
    return model, class_names


def model_status() -> dict[str, object]:
    """Load the model if necessary and return deployment metadata."""
    model, class_names = load_artifacts()
    return {
        "status": "ok",
        "model": MODEL_PATH.name,
        "classes": [LABEL_MAP.get(name, name) for name in class_names],
        "inputSize": list(IMAGE_SIZE),
    }


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            rgb = image.convert("RGB")
            resized = rgb.resize(IMAGE_SIZE, Image.Resampling.BILINEAR)
            array = np.asarray(resized, dtype=np.float32)
    except (OSError, UnidentifiedImageError) as error:
        raise ValueError("The uploaded file is not a readable image.") from error
    return np.expand_dims(array, axis=0)


def predict_image(image_bytes: bytes, plant_id: str | None = None) -> dict[str, object]:
    model, class_names = load_artifacts()
    image = preprocess_image(image_bytes)
    # Serialize calls so concurrent requests cannot oversubscribe the hackathon GPU.
    with _INFERENCE_LOCK:
        probabilities = model(image, training=False).numpy()[0]

    index = int(np.argmax(probabilities))
    raw_label = class_names[index]
    prediction = LABEL_MAP.get(raw_label, raw_label)
    result: dict[str, object] = {
        "prediction": prediction,
        "confidence": round(float(probabilities[index]), 4),
        "severity": SEVERITY_MAP.get(prediction, 0.0),
    }
    if plant_id:
        result["plantId"] = plant_id
    return result

