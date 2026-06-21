"use client";

import { useRouter } from "next/navigation";
import { FarmMap } from "@/components/simulation/FarmMap";
import { simulationActions } from "@/store/simulationStore";
import { ConditionAdjuster } from "./ConditionAdjuster";
import { QuickStartScenarios } from "./QuickStartScenarios";
import { SimulationSettings } from "./SimulationSettings";
import { WhatHappensNext } from "./WhatHappensNext";

export function ConfigurationPage() {
  const router = useRouter();

  function generateSimulation() {
    simulationActions.generateSimulation();
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7EF] text-[#1F2A24] lg:h-screen lg:overflow-hidden">
      <main className="mx-auto flex w-full max-w-[1480px] min-h-0 flex-1 flex-col px-5 py-5 sm:px-8 lg:px-10 lg:py-4">
        <div className="mb-4 max-w-3xl shrink-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1F2A24] sm:text-3xl">
              Configure Greenhouse Simulation
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-[#667065]">
              Set the starting greenhouse conditions that will generate the hidden disease scenario.
            </p>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <div className="grid content-start gap-4 lg:grid-rows-[auto_auto_auto]">
            <ConditionAdjuster />
            <SimulationSettings />
            <QuickStartScenarios />
          </div>
          <div className="grid min-h-0 gap-4 lg:grid-rows-[minmax(0,1fr)_auto_auto]">
            <FarmMap />
            <WhatHappensNext />
            <div className="flex justify-end gap-3">
              <button type="button" className="rounded-lg border border-[#CCD6C8] bg-white px-5 py-2.5 text-sm font-medium text-[#39463E] hover:bg-[#F7F8F3]">
                Cancel
              </button>
              <button type="button" onClick={generateSimulation} className="rounded-lg border border-[#2E7D32] bg-[#2E7D32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#256629]">
                Generate Greenhouse
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
