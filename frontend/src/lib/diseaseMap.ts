import { getTomatoImageForPlant } from "./tomatoImages";
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function normalizeRange(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp01((value - min) / (max - min));
}

function getNoise(row: number, col: number) {
  const raw = Math.sin(row * 13.13 + col * 17.17 + row * col * 0.11) * 43758.5453;
  return raw - Math.floor(raw);
}

function getEnvironmentRisk(environment: EnvironmentParams) {
  const humidityRisk = normalizeRange(environment.humidity, 65, 92);
  const soilMoistureRisk = normalizeRange(environment.soilMoisture, 35, 85);
  const lowLightRisk = clamp01(1 - normalizeRange(environment.light, 250, 650));
  const mildTempRisk = clamp01(1 - Math.abs(environment.temperature - 22.5) / 7.5);
  return clamp01(0.35 * humidityRisk + 0.25 * soilMoistureRisk + 0.2 * lowLightRisk + 0.2 * mildTempRisk);
}

function getDiseaseLabel(actualRisk: number, environment: EnvironmentParams, row: number, col: number): DiseaseLabel {
  if (actualRisk < 0.35) return "healthy";

  const humidityRisk = normalizeRange(environment.humidity, 65, 92);
  const soilMoistureRisk = normalizeRange(environment.soilMoisture, 35, 85);
  const lowLightRisk = clamp01(1 - normalizeRange(environment.light, 250, 650));
  const mildTempRisk = clamp01(1 - Math.abs(environment.temperature - 22.5) / 7.5);
  const warmTempRisk = clamp01(1 - Math.abs(environment.temperature - 27) / 5.5);
  const coolTempRisk = clamp01(1 - Math.abs(environment.temperature - 19) / 5);
  const generalStress = clamp01(Math.max(lowLightRisk, soilMoistureRisk, humidityRisk * 0.8));
  const noise = getNoise(row, col);

  const scores: Record<Exclude<DiseaseLabel, "healthy">, number> = {
    leaf_mold: 0.48 * humidityRisk + 0.28 * lowLightRisk + 0.18 * mildTempRisk + 0.06 * noise,
    late_blight: 0.44 * humidityRisk + 0.34 * soilMoistureRisk + 0.16 * coolTempRisk + 0.06 * (1 - noise),
    early_blight: 0.46 * warmTempRisk + 0.28 * humidityRisk + 0.2 * generalStress + 0.06 * noise,
  };

  return (Object.entries(scores).sort((left, right) => right[1] - left[1])[0][0] as DiseaseLabel);
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
      const clusterNoise = (getNoise(row + 11, col + 7) - 0.5) * 0.16;
      const clusterStrengthAdjustedByEnvironment = clamp01(
        clusterStrength * (0.55 + environmentRisk * 0.45) + clusterNoise,
      );
      const actualRisk = clamp01(0.35 * environmentRisk + 0.65 * clusterStrengthAdjustedByEnvironment);
      const trueLabel = getDiseaseLabel(actualRisk, environment, row, col);

      plants.push({
        id: `plant-r${row}-c${col}`,
        row,
        col,
        trueLabel,
        imageUrl: getTomatoImageForPlant(trueLabel, row, col),
        beliefLabel: "healthy",
        actualRisk,
        beliefRisk: 0.15,
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
