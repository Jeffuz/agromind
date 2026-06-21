"use client";

import { Card } from "@/components/layout/Card";
import type { EnvironmentParams } from "@/lib/types";
import { simulationActions, useSimulationStore } from "@/store/simulationStore";

const conditions: Array<{
  key: keyof EnvironmentParams;
  name: string;
  description: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}> = [
  { key: "humidity", name: "Humidity", description: "Relative humidity", min: 0, max: 100, step: 1, format: (value) => `${value}%` },
  { key: "temperature", name: "Temperature", description: "Air temperature", min: 0, max: 45, step: 0.1, format: (value) => `${value} °C` },
  { key: "light", name: "Light", description: "Photosynthetic light", min: 0, max: 1000, step: 10, format: (value) => `${value} PPFD` },
  { key: "soilMoisture", name: "Soil Moisture", description: "Volumetric water content", min: 0, max: 100, step: 1, format: (value) => `${value}%` },
];

export function ConditionAdjuster() {
  const environment = useSimulationStore((simulation) => simulation.environment);

  function setCondition(key: keyof EnvironmentParams, value: number) {
    simulationActions.setEnvironment({ ...environment, [key]: value });
  }

  return (
    <Card className="h-full overflow-hidden" title="Environment Conditions" subtitle="These values seed hidden disease pressure before scouting begins.">
      <div className="divide-y divide-[#E3E7DD]">
        {conditions.map((condition) => {
          const value = environment[condition.key];

          return (
            <label
              key={condition.key}
              className="grid grid-cols-[minmax(105px,0.8fr)_minmax(120px,1.2fr)_80px] items-center gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#FBFCF8] first:pt-2.5 last:pb-2.5"
            >
              <span>
                <span className="block text-xs font-medium text-[#1F2A24]">{condition.name}</span>
                <span className="mt-0.5 block text-[11px] text-[#758074]">{condition.description}</span>
              </span>
              <input
                type="range"
                min={condition.min}
                max={condition.max}
                step={condition.step}
                value={value}
                onChange={(event) => setCondition(condition.key, Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer accent-[#2E7D32] focus:outline-none focus:ring-2 focus:ring-[#BFD6BA]"
              />
              <span className="text-right">
                <span className="block text-xs font-semibold tabular-nums text-[#1F2A24]">{condition.format(value)}</span>
                <span className="mt-0.5 block text-[10px] leading-none text-[#758074]">
                  {condition.key === "humidity" && (value >= 80 ? "High" : value >= 60 ? "Moderate" : "Low")}
                  {condition.key === "temperature" && (value > 27 ? "Warm" : value >= 18 ? "Mild" : "Cool")}
                  {condition.key === "light" && (value < 350 ? "Low" : value < 600 ? "Moderate" : "Bright")}
                  {condition.key === "soilMoisture" && (value >= 75 ? "Wet" : value >= 45 ? "Balanced" : "Dry")}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
