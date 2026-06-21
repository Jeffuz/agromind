import { PageHeader } from "@/components/layout/PageHeader";
import { FarmMap } from "@/components/simulation/FarmMap";
import { ConditionAdjuster } from "./ConditionAdjuster";
import { QuickStartScenarios } from "./QuickStartScenarios";
import { SimulationSettings } from "./SimulationSettings";
import { WhatHappensNext } from "./WhatHappensNext";

export function ConfigurationPage() {
  return (
    <main>
      <PageHeader title="Configuration" />
      <ConditionAdjuster />
      <SimulationSettings />
      <QuickStartScenarios />
      <FarmMap />
      <WhatHappensNext />
    </main>
  );
}
