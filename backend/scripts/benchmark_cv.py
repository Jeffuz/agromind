import argparse
import statistics
import time
from pathlib import Path

from cv_service import predict_image


def main() -> None:
    parser = argparse.ArgumentParser(description="Measure warm CV inference latency.")
    parser.add_argument("image", type=Path)
    parser.add_argument("--runs", type=int, default=20)
    args = parser.parse_args()
    image_bytes = args.image.read_bytes()

    predict_image(image_bytes)  # Model load and GPU warm-up are intentionally excluded.
    timings = []
    for _ in range(args.runs):
        start = time.perf_counter()
        predict_image(image_bytes)
        timings.append((time.perf_counter() - start) * 1000)

    ordered = sorted(timings)
    p95_index = max(0, round(0.95 * len(ordered)) - 1)
    print(f"runs={len(timings)}")
    print(f"mean_ms={statistics.mean(timings):.2f}")
    print(f"median_ms={statistics.median(timings):.2f}")
    print(f"p95_ms={ordered[p95_index]:.2f}")


if __name__ == "__main__":
    main()

