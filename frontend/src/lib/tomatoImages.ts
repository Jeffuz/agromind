import type { DiseaseLabel } from "./types";

const HEALTHY_IMAGE_COUNT = 20;
const EARLY_BLIGHT_IMAGE_COUNT = 20;
const LATE_BLIGHT_IMAGE_COUNT = 20;
const LEAF_MOLD_IMAGE_COUNT = 20;

function buildImagePool(folder: string, filePrefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `/${folder}/${filePrefix}-${String(index + 1).padStart(3, "0")}.jpg`);
}

export const TOMATO_IMAGE_POOLS: Record<DiseaseLabel, string[]> = {
  healthy: buildImagePool("tomato/healthy", "healthy", HEALTHY_IMAGE_COUNT),
  early_blight: buildImagePool("tomato/early_blight", "early-blight", EARLY_BLIGHT_IMAGE_COUNT),
  late_blight: buildImagePool("tomato/late_blight", "late-blight", LATE_BLIGHT_IMAGE_COUNT),
  leaf_mold: buildImagePool("tomato/leaf_mold", "leaf-mold", LEAF_MOLD_IMAGE_COUNT),
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getTomatoImageForPlant(label: DiseaseLabel, row: number, col: number): string {
  const pool = TOMATO_IMAGE_POOLS[label];
  return pool[hashString(`${label}-${row}-${col}`) % pool.length];
}
