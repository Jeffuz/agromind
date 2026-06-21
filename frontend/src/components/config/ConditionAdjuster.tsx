import { Card } from "@/components/layout/Card";

const conditions = [
  { name: "Humidity", description: "Relative humidity", value: "78%", width: "w-[78%]" },
  { name: "Temperature", description: "Air temperature", value: "26.4 °C", width: "w-[58%]" },
  { name: "Light", description: "Photosynthetic light", value: "420 PPFD", width: "w-[62%]" },
  { name: "Soil Moisture", description: "Volumetric water content", value: "28%", width: "w-[28%]" },
];

export function ConditionAdjuster() {
  return (
    <Card className="h-full overflow-hidden"
      title="Environment Conditions"
      subtitle="These values seed hidden disease pressure before scouting begins."
      action={<button type="button" className="shrink-0 text-xs font-medium text-emerald-400">Reset to Defaults</button>}
    >
      <div className="divide-y divide-slate-800">
        {conditions.map((condition) => (
          <div key={condition.name} className="grid grid-cols-[minmax(105px,0.8fr)_minmax(120px,1.2fr)_80px] items-center gap-4 py-2.5 first:pt-0 last:pb-0">
              <div>
                <h3 className="text-xs font-medium text-slate-200">{condition.name}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">{condition.description}</p>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800">
                <div className={`relative h-full rounded-full bg-emerald-600 ${condition.width}`}>
                  <span className="absolute -right-1 -top-1 size-3.5 rounded-full border-2 border-[#0b1516] bg-emerald-400" />
                </div>
                </div>
                <span className="text-right text-xs font-semibold tabular-nums text-white">{condition.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
