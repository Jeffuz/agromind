import { Card } from "@/components/layout/Card";
import type { EnvironmentParams } from "@/lib/types";

interface SensorDataPanelProps {
  environment: EnvironmentParams;
}

export function SensorDataPanel({ environment }: SensorDataPanelProps) {
  const values = [
    { label: "Humidity", value: `${environment.humidity}%` },
    { label: "Temperature", value: `${environment.temperature} °C` },
    { label: "Light", value: `${environment.light} PPFD` },
    { label: "Soil Moisture", value: `${environment.soilMoisture}%` },
  ];

  return (
    <Card className="h-full overflow-hidden" title="Initial Sensor Data" subtitle="Initial greenhouse conditions used to seed the hidden scenario.">
      <dl className="divide-y divide-[#E3E7DD]">
        {values.map((sensor) => (
          <div key={sensor.label} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
            <dt className="text-xs text-[#667065]">{sensor.label}</dt>
            <dd className="text-xs font-medium tabular-nums text-[#1F2A24]">{sensor.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
