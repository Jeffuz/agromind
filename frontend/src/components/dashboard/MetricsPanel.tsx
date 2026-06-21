import { Card } from "@/components/layout/Card";
import type { Metrics } from "@/lib/types";

interface MetricsPanelProps {
  metrics: Metrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const values = [
    { label: "Plants Inspected", value: `${metrics.inspectedPlants} / ${metrics.totalPlants}` },
    { label: "Inspection Coverage", value: `${metrics.inspectionCoverage}%` },
    { label: "Disease Signals Found", value: metrics.diseaseSignalsFound },
    { label: "Estimated Spray Avoided", value: `${metrics.estimatedSprayAvoided}%` },
    { label: "Agent Confidence", value: `${metrics.agentConfidence}%` },
  ];

  return (
    <Card className="h-full overflow-hidden" title="Scouting Progress" subtitle="Current inspection efficiency.">
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        {values.map((metric) => (
          <div key={metric.label} className="border-l border-[#BFD6BA] pl-2.5 last:col-span-2">
            <dt className="text-[10px] leading-3 text-[#758074]">{metric.label}</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-[#1F2A24]">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
