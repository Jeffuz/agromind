import os
import json

from dotenv import load_dotenv
load_dotenv()  # reads .env from the working directory

from openai import OpenAI
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
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
# Claude reasoning analysis
# ---------------------------------------------------------------------------

@app.post("/farm/analyze")
def analyze_farm():
    """Stream Nemotron reasoning over the heatmap, then emit structured JSON."""
    visited_cells = []
    high_risk, medium_risk, healthy, unvisited = [], [], [], []

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

    if not visited_cells:
        raise HTTPException(status_code=400, detail="No cells scanned yet — start the robot first.")

    header = "     " + "  ".join(f"C{c:02d}" for c in range(GRID_SIZE))
    rows = [header]
    for r in range(GRID_SIZE):
        vals = [" ?  " if farm.observed[r][c] is None else f"{farm.observed[r][c]:.2f}" for c in range(GRID_SIZE)]
        rows.append(f"R{r:02d}: " + "  ".join(vals))
    grid_text = "\n".join(rows)

    high_risk_coords = [(r, c) for r, c, _ in high_risk]

    stats = {
        "visited": len(visited_cells),
        "total": GRID_SIZE * GRID_SIZE,
        "high_risk": len(high_risk),
        "medium_risk": len(medium_risk),
        "healthy": len(healthy),
        "unvisited": len(unvisited),
    }

    prompt = f"""You are an agricultural AI assistant analyzing plant disease scan data from an autonomous farm robot.

The farm is a 10×10 grid. Infection scores range from 0.0 (healthy) to 1.0 (severely infected).
Cells marked "?" have not yet been visited by the robot.

THRESHOLDS:
- High risk  (>0.6): immediate treatment required
- Medium risk (0.3–0.6): monitor closely
- Healthy    (<0.3): safe

GRID SCAN — rows R00–R09, columns C00–C09:
{grid_text}

STATISTICS:
- Visited   : {len(visited_cells)}/100
- High risk : {len(high_risk)} cells at {high_risk_coords[:12]}{"..." if len(high_risk) > 12 else ""}
- Medium    : {len(medium_risk)} cells
- Healthy   : {len(healthy)} cells
- Unvisited : {len(unvisited)} cells

Think through the data step by step: identify infection clusters, healthy zones, unscanned areas, and what the farmer should do next.

After your reasoning write the word ANALYSIS: on its own line, then output ONLY this JSON (no markdown fences):
{{"overview":"...","high_risk_areas":"...","healthy_areas":"...","unvisited_areas":"...","recommendations":"..."}}"""

    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="NVIDIA_API_KEY environment variable not set.")

    client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=api_key)

    def event_stream():
        full_text = ""
        try:
            stream = client.chat.completions.create(
                model="nvidia/llama-3.1-nemotron-nano-8b-v1",
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_text += delta
                    yield f"data: {json.dumps({'type': 'token', 'text': delta})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'detail': str(e)})}\n\n"
            return

        # Extract JSON after the ANALYSIS: marker
        analysis: dict = {}
        if "ANALYSIS:" in full_text:
            raw = full_text.split("ANALYSIS:", 1)[1].strip()
        else:
            raw = full_text.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1].lstrip("json").strip()

        try:
            analysis = json.loads(raw)
        except Exception:
            # Fallback: find the last {...} block
            start = raw.rfind("{")
            end = raw.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    analysis = json.loads(raw[start:end])
                except Exception:
                    analysis = {"overview": full_text, "high_risk_areas": "", "healthy_areas": "", "unvisited_areas": "", "recommendations": ""}

        yield f"data: {json.dumps({'type': 'done', 'analysis': analysis, 'stats': stats})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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
