import numpy as np

GRID_SIZE = 10

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
