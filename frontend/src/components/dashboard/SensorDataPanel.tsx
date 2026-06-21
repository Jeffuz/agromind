import { Card } from "@/components/layout/Card";

const sensorValues = [
  { label: "Humidity", value: "78%", status: "High", statusClass: "text-red-300" },
  { label: "Temperature", value: "26.4 °C", status: "Ideal", statusClass: "text-emerald-300" },
  { label: "Light", value: "420 PPFD", status: "Ideal", statusClass: "text-emerald-300" },
  { label: "Soil Moisture", value: "28%", status: "Low", statusClass: "text-amber-300" },
];

export function SensorDataPanel() {
  return (
    <Card className="h-full overflow-hidden" title="Initial Sensor Data" subtitle="Initial greenhouse conditions used to seed the hidden scenario.">
      <dl className="divide-y divide-slate-800">
        {sensorValues.map((sensor) => (
          <div key={sensor.label} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
            <dt className="text-xs text-slate-400">{sensor.label}</dt>
            <dd className="flex items-center gap-2 text-xs">
              <span className="font-medium tabular-nums text-slate-200">{sensor.value}</span>
              <span className={sensor.statusClass}>{sensor.status}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
