import { Card } from "@/components/layout/Card";

const scenarios = [
  { title: "Low Risk", description: "Healthy conditions, minimal pressure.", accent: "border-l-emerald-600" },
  { title: "Balanced", description: "Typical conditions, moderate risk.", accent: "border-l-amber-600" },
  { title: "High Humidity Outbreak", description: "Humidity favors fungal disease.", accent: "border-l-orange-600" },
  { title: "Poor Light + Wet Soil", description: "Plant stress raises disease risk.", accent: "border-l-violet-600" },
];

export function QuickStartScenarios() {
  return (
    <Card className="h-full overflow-hidden" title="Quick Start Scenarios" subtitle="Load recommended starting conditions.">
      <div className="grid gap-3 sm:grid-cols-2">
        {scenarios.map((scenario) => (
          <button key={scenario.title} type="button" className={`rounded-lg border border-slate-800 border-l-2 bg-[#081112] px-3 py-2 text-left ${scenario.accent}`}>
            <span className="block text-xs font-medium text-slate-200">{scenario.title}</span>
            <span className="mt-1 block text-[11px] leading-4 text-slate-500">{scenario.description}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
