import { Card } from "@/components/layout/Card";

const scenarios = [
  { title: "Low Risk", description: "Healthy conditions, minimal pressure.", accent: "border-l-green-600" },
  { title: "Balanced", description: "Typical conditions, moderate risk.", accent: "border-l-amber-500" },
  { title: "High Humidity Outbreak", description: "Humidity favors fungal disease.", accent: "border-l-orange-600" },
  { title: "Poor Light + Wet Soil", description: "Plant stress raises disease risk.", accent: "border-l-stone-500" },
];

export function QuickStartScenarios() {
  return (
    <Card className="h-full overflow-hidden" title="Quick Start Scenarios" subtitle="Load recommended starting conditions.">
      <div className="grid gap-3 sm:grid-cols-2">
        {scenarios.map((scenario) => (
          <button key={scenario.title} type="button" className={`rounded-lg border border-[#DDE5D8] border-l-2 bg-[#FCFCF8] px-3 py-2 text-left hover:bg-[#F3F7EF] ${scenario.accent}`}>
            <span className="block text-xs font-medium text-[#1F2A24]">{scenario.title}</span>
            <span className="mt-1 block text-[11px] leading-4 text-[#667065]">{scenario.description}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
