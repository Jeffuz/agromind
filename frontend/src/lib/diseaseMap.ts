import type { DiseaseLabel, EnvironmentParams, Plant, Robot } from "./types";

interface GreenhouseInput {
  rows: number;
  cols: number;
  robotCount: number;
  environment: EnvironmentParams;
}

interface GreenhouseOutput {
  plants: Plant[];
  robots: Robot[];
}

function getEnvironmentRisk(environment: EnvironmentParams) {
  let risk = 0;
  if (environment.humidity > 80) risk += 0.35;
  if (environment.soilMoisture > 70) risk += 0.25;
  if (environment.light < 450) risk += 0.15;
  if (environment.temperature >= 18 && environment.temperature <= 27) risk += 0.2;
  return Math.min(risk, 1);
}

function getDiseaseLabel(risk: number, row: number, col: number): DiseaseLabel {
  if (risk < 0.38) return "healthy";
  const labels: DiseaseLabel[] = ["early_blight", "late_blight", "leaf_mold"];
  return labels[(row * 3 + col * 5) % labels.length];
}

export function generateGreenhouse({ rows, cols, robotCount, environment }: GreenhouseInput): GreenhouseOutput {
  const environmentRisk = getEnvironmentRisk(environment);
  const centerCount = environmentRisk < 0.35 ? 1 : environmentRisk < 0.7 ? 2 : 3;
  const centerFractions = [
    [0.28, 0.3],
    [0.7, 0.68],
    [0.42, 0.78],
  ];
  const centers = centerFractions.slice(0, centerCount).map(([row, col]) => ({
    row: row * Math.max(rows - 1, 1),
    col: col * Math.max(cols - 1, 1),
  }));
  const radius = Math.max(3, Math.min(rows, cols) * 0.32);

  const plants: Plant[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const closestDistance = Math.min(
        ...centers.map((center) => Math.hypot(row - center.row, col - center.col)),
      );
      const clusterStrength = Math.max(0, 1 - closestDistance / radius);
      const actualRisk = Math.min(
        1,
        Number((environmentRisk * 0.3 + clusterStrength * (0.3 + environmentRisk * 0.55)).toFixed(3)),
      );

      plants.push({
        id: `plant-r${row}-c${col}`,
        row,
        col,
        trueLabel: getDiseaseLabel(actualRisk, row, col),
        beliefLabel: "unknown",
        actualRisk,
        beliefRisk: 0,
        inspected: false,
        isCurrentTarget: false,
      });
    }
  }

  const corners = [
    [0, 0],
    [0, Math.max(cols - 1, 0)],
    [Math.max(rows - 1, 0), 0],
    [Math.max(rows - 1, 0), Math.max(cols - 1, 0)],
  ];
  const robots: Robot[] = Array.from({ length: robotCount }, (_, index) => ({
    id: `robot-${index + 1}`,
    row: corners[index % corners.length][0],
    col: corners[index % corners.length][1],
    status: "idle",
  }));

  return { plants, robots };
}
