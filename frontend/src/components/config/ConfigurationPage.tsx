"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FarmMap } from "@/components/simulation/FarmMap";
import { generateGreenhouse } from "@/lib/diseaseMap";
import { simulationActions, useSimulationStore } from "@/store/simulationStore";
import { ConditionAdjuster } from "./ConditionAdjuster";
import { QuickStartScenarios } from "./QuickStartScenarios";
import { SimulationSettings } from "./SimulationSettings";
import { WhatHappensNext } from "./WhatHappensNext";

export function ConfigurationPage() {
  const router = useRouter();
  const rows = useSimulationStore((simulation) => simulation.rows);
  const cols = useSimulationStore((simulation) => simulation.cols);
  const robotCount = useSimulationStore((simulation) => simulation.robotCount);
  const environment = useSimulationStore((simulation) => simulation.environment);
  const preview = useMemo(
    () => generateGreenhouse({ rows, cols, robotCount, environment }),
    [cols, environment, robotCount, rows],
  );

  function generateSimulation() {
    simulationActions.generateSimulation();
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7EF] text-[#1F2A24] lg:h-screen lg:overflow-hidden">
      <main className="mx-auto flex w-full max-w-[1480px] min-h-0 flex-1 flex-col px-5 py-5 sm:px-8 lg:px-10 lg:py-4">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1F2A24] sm:text-3xl">
            Configure Greenhouse Simulation
          </h1>
          <button type="button" onClick={generateSimulation} className="shrink-0 rounded-lg border border-[#2E7D32] bg-[#2E7D32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#256629]">
            Generate Greenhouse
          </button>
        </div>

        <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <div className="grid content-start gap-4 lg:grid-rows-[auto_auto_auto]">
            <QuickStartScenarios />
            <ConditionAdjuster />
            <WhatHappensNext />
          </div>
          <div className="grid min-h-0 gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
            <FarmMap
              plants={preview.plants}
              robots={preview.robots}
              rows={rows}
              cols={cols}
              showActualRiskOverlay
              interactive={false}
            />
            <SimulationSettings />
          </div>
        </div>

      </main>
    </div>
  );
}
