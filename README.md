# agromind
AgroMind is an AI greenhouse intelligence platform that combines environmental monitoring and autonomous scouting robots to build a live model of crop health and recommend interventions before disease outbreaks spread.

The backend includes the trained tomato disease classifier and robot-image integration. See [backend/README.md](backend/README.md) for setup and API usage.

## Simulation Model

The frontend simulation generates hidden disease pressure from greenhouse sensors and spatial hotspots. Environment risk is a simple heuristic blend of humidity, soil moisture, low light, and mild temperature, then it is mixed with cluster strength so the greenhouse looks patchy instead of random. Each plant gets a hidden `trueLabel`, an `actualRisk`, and a class-matched `imageUrl` from:

- `frontend/public/tomato/healthy`
- `frontend/public/tomato/early_blight`
- `frontend/public/tomato/late_blight`
- `frontend/public/tomato/leaf_mold`

Mock CV inspection is frontend-only for now. When you inspect a selected plant, the app uses the hidden `trueLabel` internally, returns a deterministic confidence, and updates belief with:

`uncertainty = 1 - confidence`

`beliefRisk = severity[prediction] * confidence + priorRisk * uncertainty`

Severity values:

- `healthy = 0.0`
- `leaf_mold = 0.55`
- `early_blight = 0.70`
- `late_blight = 0.90`

This is an MVP heuristic, not a calibrated plant pathology model or a lesion-coverage classifier. The real backend CV flow will replace the mock step later.
