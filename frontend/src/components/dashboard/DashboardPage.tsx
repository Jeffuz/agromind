import { BeliefMap } from "@/components/simulation/BeliefMap";
import { FarmMap } from "@/components/simulation/FarmMap";
import { SimulationToolbar } from "@/components/simulation/SimulationToolbar";
import { AgentLog } from "./AgentLog";
import { MetricsPanel } from "./MetricsPanel";
import { RecommendationPanel } from "./RecommendationPanel";
import { SensorDataPanel } from "./SensorDataPanel";

export function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050c0d] text-slate-100 xl:h-screen xl:overflow-hidden">
      <main className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col gap-3 px-5 py-3 sm:px-8 lg:px-10">
        <SimulationToolbar />

        <div className="grid min-h-0 gap-3 lg:grid-cols-2 xl:flex-1">
          <FarmMap
            title="Real Greenhouse"
            subtitle="Physical farm view. Ground truth remains hidden unless revealed."
            placeholder="Real farm map placeholder"
          />
          <BeliefMap />
        </div>

        <div className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricsPanel />
          <SensorDataPanel />
          <AgentLog />
          <RecommendationPanel />
        </div>
      </main>
    </div>
  );
}
