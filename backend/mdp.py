import numpy as np
from typing import Tuple

GAMMA = 0.9      # discount factor
THETA = 1e-8     # convergence threshold

ACTIONS: dict[str, tuple[int, int]] = {
    "UP":    (-1,  0),
    "DOWN":  ( 1,  0),
    "LEFT":  ( 0, -1),
    "RIGHT": ( 0,  1),
}


def _next_state(r: int, c: int, dr: int, dc: int, rows: int, cols: int) -> tuple[int, int]:
    nr, nc = r + dr, c + dc
    if 0 <= nr < rows and 0 <= nc < cols:
        return nr, nc
    return r, c  # wall: stay in place


def value_iteration(grid: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Solve the farm MDP via value iteration for any grid size.

    Reward design: R(s, a) = infection_level of the cell the robot lands on.
    High-infection cells attract the robot; the policy drives it toward disease clusters.

    Returns
    -------
    V      : (rows, cols) float array — state value function
    policy : (rows, cols) str array  — optimal action at each cell
    """
    rows, cols = grid.shape
    V = np.zeros((rows, cols))

    while True:
        delta = 0.0
        new_V = np.zeros_like(V)

        for r in range(rows):
            for c in range(cols):
                q_values = {}
                for action, (dr, dc) in ACTIONS.items():
                    nr, nc = _next_state(r, c, dr, dc, rows, cols)
                    reward = float(grid[nr][nc])
                    q_values[action] = reward + GAMMA * V[nr][nc]

                best = max(q_values.values())
                new_V[r][c] = best
                delta = max(delta, abs(best - V[r][c]))

        V = new_V
        if delta < THETA:
            break

    policy = np.empty((rows, cols), dtype=object)
    for r in range(rows):
        for c in range(cols):
            best_action = max(
                ACTIONS,
                key=lambda a, r=r, c=c: (
                    float(grid[_next_state(r, c, *ACTIONS[a], rows, cols)[0]][_next_state(r, c, *ACTIONS[a], rows, cols)[1]])
                    + GAMMA * V[_next_state(r, c, *ACTIONS[a], rows, cols)[0]][_next_state(r, c, *ACTIONS[a], rows, cols)[1]]
                ),
            )
            policy[r][c] = best_action

    return V, policy


def follow_policy(
    policy: np.ndarray,
    grid: np.ndarray,
    start_row: int,
    start_col: int,
    max_steps: int = 60,
) -> dict:
    """Simulate the robot following the greedy policy from a start cell."""
    rows, cols = grid.shape
    path: list[tuple[int, int]] = [(start_row, start_col)]
    visited: set[tuple[int, int]] = {(start_row, start_col)}
    r, c = start_row, start_col

    for _ in range(max_steps):
        action: str = policy[r][c]
        dr, dc = ACTIONS[action]
        nr, nc = _next_state(r, c, dr, dc, rows, cols)

        if (nr, nc) in visited:
            break

        r, c = nr, nc
        path.append((r, c))
        visited.add((r, c))

    return {
        "path": path,
        "actions": [policy[r][c] for r, c in path[:-1]],
        "infection_along_path": [float(grid[r][c]) for r, c in path],
    }
