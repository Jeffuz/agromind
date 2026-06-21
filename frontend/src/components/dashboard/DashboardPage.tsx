"use client";

import { useState } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";
import { BeliefMap } from "@/components/simulation/BeliefMap";
import { FarmMap } from "@/components/simulation/FarmMap";
import { SimulationToolbar } from "@/components/simulation/SimulationToolbar";
import { simulationActions, useSimulationStore } from "@/store/simulationStore";
import { AgentLog } from "./AgentLog";
import { InspectionPanel } from "./InspectionPanel";
import { MetricsPanel } from "./MetricsPanel";
import { RecommendationPanel } from "./RecommendationPanel";
import { SensorDataPanel } from "./SensorDataPanel";

export function DashboardPage() {
  const [inspectionAnchor, setInspectionAnchor] = useState<{ x: number; y: number } | null>(null);
  const plants = useSimulationStore((simulation) => simulation.plants);
  const robots = useSimulationStore((simulation) => simulation.robots);
  const rows = useSimulationStore((simulation) => simulation.rows);
  const cols = useSimulationStore((simulation) => simulation.cols);
  const metrics = useSimulationStore((simulation) => simulation.metrics);
  const environment = useSimulationStore((simulation) => simulation.environment);
  const agentLogs = useSimulationStore((simulation) => simulation.agentLogs);
  const recommendation = useSimulationStore((simulation) => simulation.recommendation);
  const showActualRiskOverlay = useSimulationStore((simulation) => simulation.showActualRiskOverlay);
  const agentRunStatus = useSimulationStore((simulation) => simulation.agentRunStatus);
  const isAutoRunning = useSimulationStore((simulation) => simulation.isAutoRunning);
  const autoRunSpeed = useSimulationStore((simulation) => simulation.autoRunSpeed);
  const selectedPlantId = useSimulationStore((simulation) => simulation.selectedPlantId);
  const selectedPlant = plants.find((plant) => plant.id === selectedPlantId);

  if (plants.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7EF] px-5">
        <section className="w-full max-w-md rounded-xl border border-[#DDE5D8] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-[#1F2A24]">No greenhouse generated yet.</h1>
          <p className="mt-2 text-sm text-[#667065]">Configure the growing conditions before opening the simulation workspace.</p>
          <Link href="/config" className="mt-5 inline-flex rounded-lg bg-[#2E7D32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#256629]">
            Go to configuration
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7EF] text-[#1F2A24] xl:h-screen xl:overflow-hidden">
      <main className="relative mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col gap-3 px-5 py-3 sm:px-8 lg:px-10">
        <SimulationToolbar
          showActualRiskOverlay={showActualRiskOverlay}
          onToggleActualRiskOverlay={simulationActions.toggleActualRiskOverlay}
          onToggleAutoRun={simulationActions.toggleAutoRun}
          onSetAutoRunSpeed={simulationActions.setAutoRunSpeed}
          agentRunStatus={agentRunStatus}
          isAutoRunning={isAutoRunning}
          autoRunSpeed={autoRunSpeed}
        />
        <div className="relative grid min-h-0 gap-3 lg:grid-cols-2 xl:flex-1">
          <FarmMap
            title="Real Greenhouse"
            subtitle="Physical farm view. Ground truth remains hidden unless revealed."
            plants={plants}
            robots={robots}
            rows={rows}
            cols={cols}
            showActualRiskOverlay={showActualRiskOverlay}
            selectedPlantId={selectedPlantId}
            onPlantSelect={(plantId, anchor) => {
              simulationActions.selectPlant(plantId);
              if (anchor) {
                const maxX = Math.max(16, window.innerWidth - 400);
                const maxY = Math.max(16, window.innerHeight - 340);
                setInspectionAnchor({
                  x: Math.min(anchor.x + 18, maxX),
                  y: Math.min(anchor.y + 18, maxY),
                });
              }
            }}
          />
          <BeliefMap plants={plants} rows={rows} cols={cols} />

          {selectedPlant && (
            <div
              className="pointer-events-none fixed z-20 w-[min(24rem,calc(100%-2rem))]"
              style={{
                left: `${inspectionAnchor?.x ?? 24}px`,
                top: `${inspectionAnchor?.y ?? 24}px`,
              }}
            >
              <div className="pointer-events-auto overflow-hidden rounded-xl border border-[#DDE5D8] bg-white shadow-lg">
                <div className="flex items-start justify-between gap-3 border-b border-[#EEF2E8] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1F2A24]">Plant Inspection</p>
                    <p className="text-[11px] text-[#667065]">
                      Row {selectedPlant.row + 1}, Column {selectedPlant.col + 1}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close inspection panel"
                    onClick={() => {
                      simulationActions.clearSelectedPlant();
                      setInspectionAnchor(null);
                    }}
                    className="rounded p-1 text-[#667065] hover:bg-[#F3F7EF] hover:text-[#1F2A24]"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="p-4">
                  <InspectionPanel
                    plant={selectedPlant}
                    showActualRiskOverlay={showActualRiskOverlay}
                    onInspect={simulationActions.inspectSelectedPlant}
                    canInspect={Boolean(selectedPlant.imageUrl) && !isAutoRunning && agentRunStatus === "idle"}
                    agentRunStatus={agentRunStatus}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricsPanel metrics={metrics} />
          <SensorDataPanel environment={environment} />
          <AgentLog entries={agentLogs} />
          <RecommendationPanel recommendation={recommendation} />
        </div>
      </main>
    </div>
  );
}
