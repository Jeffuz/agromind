import os
from typing import Annotated

from dotenv import load_dotenv
load_dotenv()

import httpx
import numpy as np
from fastapi import Body, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import farm
from belief import DEFAULT_PRIOR_RISK, update_belief
from cv_service import ModelUnavailableError, model_status, predict_image
from farm import GRID_SIZE, TRUE_GRID
from mdp import value_iteration, follow_policy, ACTIONS
from schemas import CVHealth, CVPrediction, ImageVisitResponse


class AgentStepRequest(BaseModel):
    belief_grid: list[list[float]]   # 1.1 sentinel for unvisited, beliefRisk for visited
    robot_row: int
    robot_col: int


class AnalyzeFarmBody(BaseModel):
    belief_grid: list[list[float | None]] | None = None  # None = unvisited

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

@app.get("/cv/health", response_model=CVHealth)
def cv_health():
    """Verify that the packaged tomato classifier can be loaded."""
    try:
        return model_status()
    except ModelUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/cv/predict", response_model=CVPrediction)
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


@app.post("/farm/visit/image", response_model=ImageVisitResponse)
async def visit_plant_with_image(
    file: Annotated[UploadFile, File()],
    row: int = Query(..., ge=0, lt=GRID_SIZE),
    col: int = Query(..., ge=0, lt=GRID_SIZE),
):
    """Classify a robot image, update belief state, and recommend the next cell."""
    image_bytes = await _read_image(file)
    plant_id = farm.plant_id_for(row, col)
    try:
        cv_result = predict_image(image_bytes, plant_id)
    except ModelUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    already_visited = farm.observed[row][col] is not None
    prior_risk = (
        float(farm.observed[row][col]) if already_visited else DEFAULT_PRIOR_RISK
    )
    belief_risk, uncertainty = update_belief(
        severity=float(cv_result["severity"]),
        confidence=float(cv_result["confidence"]),
        prior_risk=prior_risk,
    )
    farm.record_observation(row, col, belief_risk)
    effective_grid = farm.get_effective_grid()
    values, policy = value_iteration(effective_grid)
    return {
        "visited": (row, col),
        "plantId": plant_id,
        "cv": cv_result,
        "beliefRisk": belief_risk,
        "uncertainty": uncertainty,
        "priorRisk": prior_risk,
        "alreadyVisited": already_visited,
        "nextRecommended": _best_next(row, col, policy, values),
        "allDone": farm.all_visited(),
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
# Claude reasoning analysis
# ---------------------------------------------------------------------------

AGENT_URL = os.getenv("FARM_ANALYST_URL", "http://localhost:8002")


# ---------------------------------------------------------------------------
# Agent step — MDP on the frontend-generated grid
# ---------------------------------------------------------------------------

@app.post("/farm/agent/step")
async def agent_step(req: AgentStepRequest):
    """
    Run value iteration on the frontend belief grid and return the best next cell.
    Cells with value > 1.0 are treated as unvisited (sentinel 1.1).
    """
    grid = np.array(req.belief_grid, dtype=float)
    rows, cols = grid.shape
    V, policy = value_iteration(grid)
    next_cell = _best_next_dynamic(req.robot_row, req.robot_col, policy, V, grid, rows, cols)

    return {
        "next_row": next_cell["row"] if next_cell else req.robot_row,
        "next_col": next_cell["col"] if next_cell else req.robot_col,
        "action": next_cell.get("action", "STAY") if next_cell else "STAY",
        "reason": next_cell.get("reason", "no move available") if next_cell else "no move available",
        "values": [[round(float(V[r][c]), 4) for c in range(cols)] for r in range(rows)],
    }


# ---------------------------------------------------------------------------
# Farm analysis — delegate to Fetch.ai farm_analyst uAgent
# ---------------------------------------------------------------------------

@app.post("/farm/analyze")
async def analyze_farm(body: AnalyzeFarmBody = Body(default_factory=AnalyzeFarmBody)):
    """Delegate farm analysis to the Fetch.ai farm_analyst uAgent.

    Accepts an optional belief_grid from the frontend.  When omitted, falls
    back to the server-side farm.observed state (legacy robot endpoints).
    """
    if body.belief_grid is not None:
        grid = body.belief_grid
        num_rows, num_cols = len(grid), len(grid[0]) if grid else 0
        visited_cells, high_risk, medium_risk, healthy, unvisited = [], [], [], [], []
        for r in range(num_rows):
            for c in range(num_cols):
                score = grid[r][c]
                if score is None:
                    unvisited.append((r, c))
                else:
                    visited_cells.append((r, c, score))
                    if score > 0.6:
                        high_risk.append((r, c, score))
                    elif score >= 0.3:
                        medium_risk.append((r, c, score))
                    else:
                        healthy.append((r, c, score))

        # For large grids show a condensed summary instead of full ASCII art
        if num_rows <= 12 and num_cols <= 20:
            header = "     " + "  ".join(f"C{c:02d}" for c in range(num_cols))
            rows_lines = [header]
            for r in range(num_rows):
                vals = [" ?  " if grid[r][c] is None else f"{grid[r][c]:.2f}" for c in range(num_cols)]
                rows_lines.append(f"R{r:02d}: " + "  ".join(vals))
            grid_text = "\n".join(rows_lines)
        else:
            grid_text = f"[{num_rows}×{num_cols} grid — summary only]\nHigh-risk clusters: {[(r,c) for r,c,_ in high_risk[:15]]}"
    else:
        num_rows = num_cols = GRID_SIZE
        visited_cells, high_risk, medium_risk, healthy, unvisited = [], [], [], [], []
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                score = farm.observed[r][c]
                if score is None:
                    unvisited.append((r, c))
                else:
                    visited_cells.append((r, c, score))
                    if score > 0.6:
                        high_risk.append((r, c, score))
                    elif score >= 0.3:
                        medium_risk.append((r, c, score))
                    else:
                        healthy.append((r, c, score))
        header = "     " + "  ".join(f"C{c:02d}" for c in range(GRID_SIZE))
        rows_lines = [header]
        for r in range(GRID_SIZE):
            vals = [" ?  " if farm.observed[r][c] is None else f"{farm.observed[r][c]:.2f}" for c in range(GRID_SIZE)]
            rows_lines.append(f"R{r:02d}: " + "  ".join(vals))
        grid_text = "\n".join(rows_lines)

    if not visited_cells:
        raise HTTPException(status_code=400, detail="No cells scanned yet — start the robot first.")

    stats = {
        "visited": len(visited_cells),
        "total": num_rows * num_cols,
        "high_risk": len(high_risk),
        "medium_risk": len(medium_risk),
        "healthy": len(healthy),
        "unvisited": len(unvisited),
    }
    high_risk_coords = [(r, c) for r, c, _ in high_risk]

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{AGENT_URL}/analyze",
                json={"grid_text": grid_text, "stats": stats, "high_risk_coords": high_risk_coords},
            )
            resp.raise_for_status()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Farm analyst agent is not running. Start it with: python -m agents.farm_analyst",
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=exc.response.text) from exc

    payload = resp.json()
    return {
        "reasoning": payload.get("reasoning", ""),
        "analysis": payload["analysis"],
        "stats": stats,
        "agent_address": payload.get("agent_address"),
    }


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

def _best_next_dynamic(row: int, col: int, policy, V, grid: np.ndarray, rows: int, cols: int) -> dict | None:
    """Pick best adjacent unvisited cell (sentinel > 1.0) by V-value for any grid size."""
    unvisited_neighbours = []
    for action, (dr, dc) in ACTIONS.items():
        nr, nc = row + dr, col + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] > 1.0:
            unvisited_neighbours.append((float(V[nr][nc]), action, nr, nc))

    if unvisited_neighbours:
        unvisited_neighbours.sort(reverse=True)
        _, action, nr, nc = unvisited_neighbours[0]
        return {"row": nr, "col": nc, "action": action, "reason": "highest-value unvisited neighbour"}

    action = policy[row][col]
    dr, dc = ACTIONS[action]
    nr, nc = row + dr, col + dc
    if 0 <= nr < rows and 0 <= nc < cols:
        return {"row": nr, "col": nc, "action": action, "reason": "policy (all neighbours visited)"}
    return None


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
