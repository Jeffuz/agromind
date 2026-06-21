from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import farm
from cv_service import ModelUnavailableError, model_status, predict_image
from farm import GRID_SIZE, TRUE_GRID
from mdp import value_iteration, follow_policy, ACTIONS

app = FastAPI(title="AgroMind API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_IMAGE_BYTES = 10 * 1024 * 1024


# ---------------------------------------------------------------------------
# Computer vision
# ---------------------------------------------------------------------------

@app.get("/cv/health")
def cv_health():
    """Verify that the packaged tomato classifier can be loaded."""
    try:
        return model_status()
    except ModelUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/cv/predict")
async def cv_predict(
    file: Annotated[UploadFile, File()],
    plantId: Annotated[str | None, Form()] = None,
):
    """Classify one tomato leaf image without changing simulation state."""
    image_bytes = await _read_image(file)
    try:
        return predict_image(image_bytes, plantId)
    except ModelUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


# ---------------------------------------------------------------------------
# Grid state
# ---------------------------------------------------------------------------

@app.get("/farm/grid")
def get_grid():
    """Current observed grid. null = unvisited (CV model hasn't scored it yet)."""
    return {
        "size": GRID_SIZE,
        "grid": farm.observed,
    }


@app.get("/farm/grid/true")
def get_true_grid():
    """Full ground-truth infection grid (for debugging / visualisation only)."""
    return {
        "size": GRID_SIZE,
        "grid": TRUE_GRID.tolist(),
    }


@app.post("/farm/reset")
def reset_grid():
    """Reset the observed grid to empty (all unvisited)."""
    farm.reset()
    return {"message": "Grid reset. All cells unvisited."}


# ---------------------------------------------------------------------------
# Robot visit — simulates CV model scoring a plant
# ---------------------------------------------------------------------------

@app.post("/farm/visit")
def visit_plant(
    row: int = Query(..., ge=0, lt=GRID_SIZE),
    col: int = Query(..., ge=0, lt=GRID_SIZE),
):
    """
    Robot arrives at (row, col). CV model scores the plant.
    Returns the score, the updated MDP policy, and the recommended next cell.
    """
    already_visited = farm.observed[row][col] is not None
    score = farm.visit_plant(row, col)

    effective_grid = farm.get_effective_grid()
    V, policy = value_iteration(effective_grid)

    next_cell = _best_next(row, col, policy, V)

    return {
        "visited": (row, col),
        "score": score,
        "already_visited": already_visited,
        "next_recommended": next_cell,
        "all_done": farm.all_visited(),
    }


@app.post("/farm/visit/image")
async def visit_plant_with_image(
    file: Annotated[UploadFile, File()],
    row: int = Query(..., ge=0, lt=GRID_SIZE),
    col: int = Query(..., ge=0, lt=GRID_SIZE),
    plantId: Annotated[str | None, Form()] = None,
):
    """Classify a robot image, store its risk proxy, and update the route recommendation."""
    image_bytes = await _read_image(file)
    resolved_plant_id = plantId or f"plant_{row}_{col}"
    try:
        cv_result = predict_image(image_bytes, resolved_plant_id)
    except ModelUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    already_visited = farm.observed[row][col] is not None
    farm.record_observation(row, col, float(cv_result["severity"]))
    effective_grid = farm.get_effective_grid()
    values, policy = value_iteration(effective_grid)
    return {
        "visited": (row, col),
        "cv": cv_result,
        "score": cv_result["severity"],
        "scoreMeaning": "simulation disease-risk proxy",
        "already_visited": already_visited,
        "next_recommended": _best_next(row, col, policy, values),
        "all_done": farm.all_visited(),
    }


# ---------------------------------------------------------------------------
# MDP endpoints
# ---------------------------------------------------------------------------

@app.get("/farm/mdp/policy")
def get_policy():
    """Optimal policy computed from the currently observed scores."""
    effective_grid = farm.get_effective_grid()
    _, policy = value_iteration(effective_grid)
    return {
        "policy": [[policy[r][c] for c in range(GRID_SIZE)] for r in range(GRID_SIZE)],
    }


@app.get("/farm/mdp/values")
def get_values():
    """Value function V(s) computed from the currently observed scores."""
    effective_grid = farm.get_effective_grid()
    V, _ = value_iteration(effective_grid)
    return {
        "values": [[round(float(V[r][c]), 4) for c in range(GRID_SIZE)] for r in range(GRID_SIZE)],
    }


@app.get("/farm/mdp/next")
def get_next(
    row: int = Query(..., ge=0, lt=GRID_SIZE),
    col: int = Query(..., ge=0, lt=GRID_SIZE),
):
    """Best next cell for the robot to visit from its current position."""
    effective_grid = farm.get_effective_grid()
    V, policy = value_iteration(effective_grid)
    next_cell = _best_next(row, col, policy, V)
    return {"current": (row, col), "next_recommended": next_cell}


@app.get("/farm/mdp/path")
def get_path(
    start_row: int = Query(0, ge=0, lt=GRID_SIZE),
    start_col: int = Query(0, ge=0, lt=GRID_SIZE),
    max_steps: int = Query(60, ge=1, le=200),
):
    """Simulate the robot following the current policy from a start cell."""
    effective_grid = farm.get_effective_grid()
    _, policy = value_iteration(effective_grid)
    result = follow_policy(policy, effective_grid, start_row, start_col, max_steps)
    return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _read_image(file: UploadFile) -> bytes:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload must be an image.")
    image_bytes = await file.read(MAX_IMAGE_BYTES + 1)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit.")
    return image_bytes

def _best_next(row: int, col: int, policy, V) -> dict | None:
    """
    Pick the best adjacent unvisited cell by V-value.
    Falls back to the policy action if all neighbours are already visited.
    """
    unvisited_neighbours = []
    for action, (dr, dc) in ACTIONS.items():
        nr, nc = row + dr, col + dc
        if 0 <= nr < GRID_SIZE and 0 <= nc < GRID_SIZE:
            if farm.observed[nr][nc] is None:
                unvisited_neighbours.append((float(V[nr][nc]), action, nr, nc))

    if unvisited_neighbours:
        unvisited_neighbours.sort(reverse=True)
        _, action, nr, nc = unvisited_neighbours[0]
        return {"row": nr, "col": nc, "action": action, "reason": "highest-value unvisited neighbour"}

    # All neighbours visited — follow greedy policy
    action = policy[row][col]
    dr, dc = ACTIONS[action]
    nr, nc = row + dr, col + dc
    if 0 <= nr < GRID_SIZE and 0 <= nc < GRID_SIZE:
        return {"row": nr, "col": nc, "action": action, "reason": "policy (all neighbours visited)"}

    return None
