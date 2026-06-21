from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import farm
from farm import GRID_SIZE, TRUE_GRID
from mdp import value_iteration, follow_policy, ACTIONS

app = FastAPI(title="AgroMind API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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

def _best_next(row: int, col: int, policy, V) -> dict | None:
    """
    Pick the best adjacent unvisited cell by V-value.
    Falls back to the policy action if all neighbours are already visited.
    """
    import numpy as np

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
