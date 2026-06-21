import type { GridPosition, Plant, Robot } from "./types";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function buildManhattanPath(from: GridPosition, to: GridPosition): GridPosition[] {
  const path: GridPosition[] = [];
  let row = from.row;
  let col = from.col;

  while (row !== to.row) {
    row += row < to.row ? 1 : -1;
    path.push({ row, col });
  }

  while (col !== to.col) {
    col += col < to.col ? 1 : -1;
    path.push({ row, col });
  }

  return path;
}

export function scoreAgentTarget(plant: Plant, plants: Plant[], robot: Robot, rows: number, cols: number) {
  if (plant.inspected) return -Infinity;

  const inspectedNearby = plants.filter((other) => other.inspected && Math.abs(other.row - plant.row) + Math.abs(other.col - plant.col) <= 3);
  const neighborBeliefSignal = inspectedNearby.length === 0
    ? 0
    : inspectedNearby.reduce((sum, other) => sum + other.beliefRisk, 0) / inspectedNearby.length;

  const centerRow = (rows - 1) / 2;
  const centerCol = (cols - 1) / 2;
  const centerDistance = Math.abs(plant.row - centerRow) + Math.abs(plant.col - centerCol);
  const centerDistanceMax = Math.max(1, centerRow + centerCol);
  const centerScore = 1 - clamp01(centerDistance / centerDistanceMax);

  const distancePenalty = Math.abs(robot.row - plant.row) + Math.abs(robot.col - plant.col);
  const distancePenaltyMax = Math.max(1, rows + cols);
  const distanceScore = 1 - clamp01(distancePenalty / distancePenaltyMax);
  const tieBreaker = (hashString(plant.id) % 1000) / 1000000;

  return 0.5 * neighborBeliefSignal + 0.3 * centerScore + 0.2 * distanceScore + tieBreaker;
}
