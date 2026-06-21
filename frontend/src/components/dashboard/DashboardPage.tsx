import { PageHeader } from "@/components/layout/PageHeader";
import { BeliefMap } from "@/components/simulation/BeliefMap";
import { FarmMap } from "@/components/simulation/FarmMap";
import { SimulationToolbar } from "@/components/simulation/SimulationToolbar";
import { AgentLog } from "./AgentLog";
import { MetricsPanel } from "./MetricsPanel";
import { RecommendationPanel } from "./RecommendationPanel";
import { SensorDataPanel } from "./SensorDataPanel";

export function DashboardPage() {
  return (
    <main>
      <PageHeader title="Dashboard" />
      <SimulationToolbar />
      <FarmMap />
      <BeliefMap />
      <MetricsPanel />
      <SensorDataPanel />
      <AgentLog />
      <RecommendationPanel />
    </main>
  );
}
