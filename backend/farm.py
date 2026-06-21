import numpy as np

GRID_SIZE = 10


def plant_id_for(row: int, col: int) -> str:
    """Return the canonical plant identifier for a grid coordinate."""
    if not (0 <= row < GRID_SIZE and 0 <= col < GRID_SIZE):
        raise ValueError("Plant coordinates are outside the farm grid.")
    return f"plant_{row:02d}_{col:02d}"

# Ground truth infection levels — hidden from the robot until it visits a cell.
# Simulates what the CV model would predict for each plant.
def _generate_true_grid() -> np.ndarray:
    rng = np.random.default_rng(seed=42)
    grid = np.zeros((GRID_SIZE, GRID_SIZE))

    hotspots = [(1, 2), (6, 7), (4, 0), (8, 4)]
    spreads  = [1.8,    2.0,    1.5,    1.2]

    for (hr, hc), spread in zip(hotspots, spreads):
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                dist = np.sqrt((r - hr) ** 2 + (c - hc) ** 2)
                grid[r][c] += np.exp(-dist / spread)

    grid += rng.uniform(0.0, 0.05, (GRID_SIZE, GRID_SIZE))
    lo, hi = grid.min(), grid.max()
    grid = (grid - lo) / (hi - lo)
    return np.round(grid, 2)


TRUE_GRID: np.ndarray = _generate_true_grid()

# What the robot has observed so far. None = unvisited.
observed: list[list[float | None]] = [[None] * GRID_SIZE for _ in range(GRID_SIZE)]


def reset() -> None:
    global observed
    observed = [[None] * GRID_SIZE for _ in range(GRID_SIZE)]


def visit_plant(row: int, col: int) -> float:
    """Simulate the CV model scoring the plant at (row, col). Returns the score."""
    score = float(TRUE_GRID[row][col])
    observed[row][col] = score
    return score


def record_observation(row: int, col: int, belief_risk: float) -> None:
    """Store a confidence-aware disease belief for a robot-visited plant."""
    if not 0.0 <= belief_risk <= 1.0:
        raise ValueError("Observation score must be between 0 and 1.")
    observed[row][col] = float(belief_risk)


def get_effective_grid(default_unvisited: float = 0.3) -> np.ndarray:
    """
    Build the grid the MDP reasons over.
    Known cells use their actual CV score; unvisited cells get a small default
    reward so the robot is still drawn toward unexplored territory.
    """
    grid = np.full((GRID_SIZE, GRID_SIZE), default_unvisited, dtype=float)
    for r in range(GRID_SIZE):
        for c in range(GRID_SIZE):
            if observed[r][c] is not None:
                grid[r][c] = observed[r][c]
    return grid


def all_visited() -> bool:
    return all(observed[r][c] is not None for r in range(GRID_SIZE) for c in range(GRID_SIZE))
