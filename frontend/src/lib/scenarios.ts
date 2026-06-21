import type { ScenarioPreset } from "./types";

export const scenarioPresets: ScenarioPreset[] = [
  {
    id: "low-risk",
    name: "Low Risk",
    description: "Healthy conditions, minimal pressure.",
    environment: { humidity: 58, temperature: 24, light: 620, soilMoisture: 42 },
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Typical conditions, moderate risk.",
    environment: { humidity: 72, temperature: 25, light: 520, soilMoisture: 55 },
  },
  {
    id: "high-humidity",
    name: "High Humidity Outbreak",
    description: "Humidity favors fungal disease.",
    environment: { humidity: 91, temperature: 24, light: 430, soilMoisture: 68 },
  },
  {
    id: "poor-light-wet-soil",
    name: "Poor Light + Wet Soil",
    description: "Plant stress raises disease risk.",
    environment: { humidity: 84, temperature: 22, light: 280, soilMoisture: 82 },
  },
];
