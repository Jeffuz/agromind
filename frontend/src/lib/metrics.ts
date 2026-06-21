import type { Metrics, Plant } from "./types";

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateSimulationMetrics(plants: Plant[]): Metrics {
  const inspectedPlants = plants.filter((plant) => plant.inspected);
  const totalPlants = plants.length;
  const inspectedCount = inspectedPlants.length;
  const diseaseSignalsFound = inspectedPlants.filter((plant) => plant.cvPrediction && plant.cvPrediction !== "healthy").length;
  const averageConfidence = inspectedCount === 0
    ? 0
    : inspectedPlants.reduce((sum, plant) => sum + (plant.cvConfidence ?? 0), 0) / inspectedCount;
  const inspectionCoverage = totalPlants === 0 ? 0 : clampPercent((inspectedCount / totalPlants) * 100);
  const estimatedSprayAvoided = inspectedCount === 0
    ? 0
    : clampPercent(100 - (diseaseSignalsFound / inspectedCount) * 100);

  return {
    totalPlants,
    inspectedPlants: inspectedCount,
    inspectionCoverage,
    diseaseSignalsFound,
    estimatedSprayAvoided,
    agentConfidence: clampPercent(averageConfidence * 100),
  };
}

export function calculateInitialMetrics(plants: Plant[]): Metrics {
  return calculateSimulationMetrics(plants);
}
