export interface EnvironmentParams {
  temperature: number;
  humidity: number;
  soilMoisture: number;
}

export type DiseaseLabel = "healthy" | "at-risk" | "diseased";

export type BeliefLabel = "unknown" | DiseaseLabel;

export interface Plant {
  id: string;
  row: number;
  column: number;
  diseaseLabel: DiseaseLabel;
  beliefLabel: BeliefLabel;
}

export interface Robot {
  id: string;
  row: number;
  column: number;
}

export interface Metrics {
  healthyPlants: number;
  atRiskPlants: number;
  diseasedPlants: number;
}

export interface AgentLogEntry {
  id: string;
  message: string;
  timestamp: string;
}

export interface Recommendation {
  id: string;
  message: string;
}

export interface SimulationState {
  environment: EnvironmentParams;
  plants: Plant[];
  robots: Robot[];
  metrics: Metrics;
  isRunning: boolean;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  environment: EnvironmentParams;
}
