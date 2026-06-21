"use client";

import { Card } from "@/components/layout/Card";
import { scenarioPresets } from "@/lib/scenarios";
import { simulationActions, useSimulationStore } from "@/store/simulationStore";
import { FiCheck } from "react-icons/fi";

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
              className={`rounded-lg border px-3 py-2 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#BFD6BA] ${
                isActive
                  ? "border-[#8FBC89] bg-[#EAF5EA] shadow-[0_1px_0_rgba(46,125,50,0.08)]"
                  : `border-[#DDE5D8] bg-[#FCFCF8] hover:bg-white ${accents[index]}`
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`block text-xs font-medium ${isActive ? "text-[#256629]" : "text-[#1F2A24]"}`}>
                    {scenario.name}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-[#667065]">{scenario.description}</span>
                </div>
                {isActive && <FiCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[#2E7D32]" />}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
