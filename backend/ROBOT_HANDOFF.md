# Robot path-planning handoff

The robot integration has one required operation: send the current grid coordinate and captured leaf image to the backend. The backend handles plant identity, CV inference, uncertainty, farm-state mutation, and the next-cell recommendation.

## Request

```http
POST /farm/visit/image?row=2&col=3
Content-Type: multipart/form-data
file: <JPEG or PNG bytes>
```

Coordinates are zero-based and must be between `0` and `9`. Images are limited to 10 MB. The canonical plant identifier is derived from the coordinates: `(2, 3)` is always `plant_02_03`. The robot should not create its own plant ID.

Example:

```bash
curl -X POST "http://localhost:8000/farm/visit/image?row=2&col=3" \
  -F "file=@tests/sample_early_blight.jpg"
```

## Successful response

```json
{
  "visited": [2, 3],
  "plantId": "plant_02_03",
  "cv": {
    "prediction": "early_blight",
    "confidence": 0.9316,
    "severity": 0.7,
    "plantId": "plant_02_03"
  },
  "beliefRisk": 0.6726,
  "uncertainty": 0.0684,
  "priorRisk": 0.3,
  "alreadyVisited": false,
  "nextRecommended": {
    "row": 1,
    "col": 3,
    "action": "UP",
    "reason": "highest-value unvisited neighbour"
  },
  "allDone": false
}
```

`nextRecommended` is the handoff to path planning. It can be `null` only when no valid next move exists. `alreadyVisited` tells the caller whether this coordinate had a previous observation.

## Belief rule

The planner grid stores `beliefRisk`, not raw disease severity:

```text
uncertainty = 1 - confidence
beliefRisk = severity × confidence + 0.3 × uncertainty
```

This is an explicit MVP heuristic. A first visit uses the unknown-plant prior of `0.3`; a repeat visit uses that plant's previous belief as its prior. It is not calibrated disease probability or lesion coverage.

## State lifecycle

1. Call `POST /farm/reset` when starting a new simulation.
2. For each robot arrival, call `POST /farm/visit/image` exactly once with the coordinate and image.
3. Move according to `nextRecommended`.
4. Optionally inspect `GET /farm/grid`; unvisited cells are `null`.
5. Stop when `allDone` is `true` or the simulation's own stopping condition is met.

The backend state is currently in memory. Restarting the backend or calling reset clears all observations.

## Errors

- `400`: empty or unreadable image.
- `413`: image is larger than 10 MB.
- `415`: uploaded content type is not an image.
- `422`: row or column is missing/outside the grid.
- `503`: model artifacts cannot be loaded.

The robot owner does not need to import TensorFlow or call `/cv/predict` separately.
