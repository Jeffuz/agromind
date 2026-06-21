"use client";

import { Card } from "@/components/layout/Card";
import { scenarioPresets } from "@/lib/scenarios";
import { simulationActions, useSimulationStore } from "@/store/simulationStore";

const accents = ["border-l-green-600", "border-l-amber-500", "border-l-orange-600", "border-l-stone-500"];

export function QuickStartScenarios() {
  const environment = useSimulationStore((simulation) => simulation.environment);

  return (
    <Card className="h-full overflow-hidden" title="Quick Start Scenarios" subtitle="Load recommended starting conditions.">
      <div className="grid gap-3 sm:grid-cols-2">
        {scenarioPresets.map((scenario, index) => {
          const isActive = Object.entries(scenario.environment).every(
            ([key, value]) => environment[key as keyof typeof environment] === value,
          );

          return (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => simulationActions.applyScenario(scenario)}
              className={`rounded-lg border border-l-2 px-3 py-2 text-left transition-colors ${
                isActive
                  ? "border-[#8FBC89] bg-[#EAF5EA] ring-1 ring-[#BFD6BA]"
                  : `border-[#DDE5D8] bg-[#FCFCF8] hover:bg-[#F3F7EF] ${accents[index]}`
              }`}
            >
              <span className={`block text-xs font-medium ${isActive ? "text-[#256629]" : "text-[#1F2A24]"}`}>
                {scenario.name}
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-[#667065]">{scenario.description}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
