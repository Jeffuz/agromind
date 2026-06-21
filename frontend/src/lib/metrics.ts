import type { Metrics, Plant } from "./types";

export function calculateInitialMetrics(plants: Plant[]): Metrics {
  return {
    totalPlants: plants.length,
    inspectedPlants: 0,
    inspectionCoverage: 0,
    diseaseSignalsFound: 0,
    estimatedSprayAvoided: 0,
    agentConfidence: 0,
  };
}
