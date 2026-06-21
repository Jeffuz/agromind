import { Card } from "@/components/layout/Card";
import { MapLegend } from "./MapLegend";

export function BeliefMap() {
  return (
    <Card
      className="flex h-full min-h-[300px] flex-col overflow-hidden xl:min-h-0"
      title="Digital Twin Belief"
      subtitle="What the agent currently believes after scouting observations."
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="relative flex min-h-[190px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-[#C9DDD6] bg-[#EEF6F3]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(63,125,111,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(63,125,111,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div className="relative px-6 text-center">
            <p className="text-sm font-medium text-[#587068]">Belief map placeholder</p>
            <p className="mt-1.5 text-xs text-[#7A8D86]">Agent knowledge begins empty and changes after inspections.</p>
          </div>
        </div>
        <MapLegend />
      </div>
    </Card>
  );
}
