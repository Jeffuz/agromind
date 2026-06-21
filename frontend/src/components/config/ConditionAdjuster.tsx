"use client";

import { Card } from "@/components/layout/Card";
import type { EnvironmentParams } from "@/lib/types";
import { 
  // defaultEnvironment, 
  simulationActions, useSimulationStore } from "@/store/simulationStore";

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
    <Card
      className="h-full overflow-hidden"
      title="Environment Conditions"
      subtitle="These values seed hidden disease pressure before scouting begins."
      // action={
      //   <button type="button" onClick={() => simulationActions.setEnvironment({ ...defaultEnvironment })} className="shrink-0 text-xs font-medium text-[#2E7D32]">
      //     Reset to Defaults
      //   </button>
      // }
    >
      <div className="divide-y divide-[#E3E7DD]">
        {conditions.map((condition) => {
          const value = environment[condition.key];
          return (
            <label key={condition.key} className="grid grid-cols-[minmax(105px,0.8fr)_minmax(120px,1.2fr)_80px] items-center gap-4 py-2.5 first:pt-0 last:pb-0">
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
                className="h-1.5 w-full cursor-pointer accent-[#2E7D32]"
              />
              <span className="text-right text-xs font-semibold tabular-nums text-[#1F2A24]">
                {condition.format(value)}
              </span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
