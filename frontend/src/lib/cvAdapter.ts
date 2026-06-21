import type { DiseaseLabel, Plant } from "./types";

export const DISEASE_SEVERITY: Record<DiseaseLabel, number> = {
  healthy: 0,
  leaf_mold: 0.55,
  early_blight: 0.7,
  late_blight: 0.9,
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function mockClassifyPlantImage(plant: Plant): { prediction: DiseaseLabel; confidence: number } {
  const hash = hashString(`${plant.id}-${plant.row}-${plant.col}`);
  const noise = (hash % 1000) / 1000;
  const confidence = 0.86 + noise * 0.11;
  return {
    prediction: plant.trueLabel,
    confidence: Number(confidence.toFixed(4)),
  };
}

export function calculateBeliefRisk({
  prediction,
  confidence,
  priorRisk,
}: {
  prediction: DiseaseLabel;
  confidence: number;
  priorRisk: number;
}) {
  const uncertainty = 1 - clamp01(confidence);
  return Number((DISEASE_SEVERITY[prediction] * confidence + priorRisk * uncertainty).toFixed(4));
}
