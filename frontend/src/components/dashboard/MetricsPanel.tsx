import { Card } from "@/components/layout/Card";

const metrics = [
  { label: "Plants Inspected", value: "37 / 800" },
  { label: "Inspection Coverage", value: "4.6%" },
  { label: "Disease Signals Found", value: "2" },
  { label: "Estimated Spray Avoided", value: "91%" },
  { label: "Agent Confidence", value: "82%" },
];

export function MetricsPanel() {
  return (
    <Card className="h-full overflow-hidden" title="Scouting Progress" subtitle="Current inspection efficiency.">
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="border-l border-emerald-900 pl-2.5 last:col-span-2">
            <dt className="text-[10px] leading-3 text-slate-500">{metric.label}</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-slate-100">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
