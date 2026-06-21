export type EnvironmentParams = {
  humidity: number;
  temperature: number;
  light: number;
  soilMoisture: number;
};

export type DiseaseLabel =
  | "healthy"
  | "early_blight"
  | "late_blight"
  | "leaf_mold";

export type BeliefLabel = "unknown" | DiseaseLabel;

export type GridPosition = {
  row: number;
  col: number;
};

export type AgentRunStatus = "idle" | "planning" | "moving" | "processing" | "complete";

export type Plant = {
  id: string;
  row: number;
  col: number;
  trueLabel: DiseaseLabel;
  imageUrl?: string;
  cvPrediction?: DiseaseLabel;
  cvConfidence?: number;
  inspectedAtTick?: number;
  beliefLabel: BeliefLabel;
  actualRisk: number;
  beliefRisk: number;
  inspected: boolean;
  isCurrentTarget: boolean;
};

export type Robot = {
  id: string;
  row: number;
  col: number;
  targetPlantId?: string;
  status: "idle" | "moving" | "inspecting";
};

export type Metrics = {
  totalPlants: number;
  inspectedPlants: number;
  inspectionCoverage: number;
  diseaseSignalsFound: number;
  estimatedSprayAvoided: number;
  agentConfidence: number;
};

export type AgentLogEntry = {
  id: string;
  tick: number;
  message: string;
};

export type Recommendation = {
  title: string;
  body: string;
  nextAction?: string;
};

export type ScenarioPreset = {
  id: string;
  name: string;
  description: string;
  environment: EnvironmentParams;
};

export type SimulationState = {
  phase: "config" | "dashboard";
  tick: number;
  rows: number;
  cols: number;
  robotCount: number;
  environment: EnvironmentParams;
  plants: Plant[];
  robots: Robot[];
  showActualRiskOverlay: boolean;
  agentRunStatus: AgentRunStatus;
  isAutoRunning: boolean;
  autoRunSpeed: 1 | 2 | 4 | 8;
  activeRobotId?: string;
  activeTargetPlantId?: string;
  activePath: GridPosition[];
  activePathIndex: number;
  metrics: Metrics;
  agentLogs: AgentLogEntry[];
  recommendation?: Recommendation;
  selectedPlantId?: string;
  lastInspectedPlantId?: string;
};
