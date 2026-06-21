import { FiSun } from "react-icons/fi";
import { GiPlantWatering } from "react-icons/gi";
import { WiHumidity, WiThermometer } from "react-icons/wi";
import { Card } from "@/components/layout/Card";
import type { EnvironmentParams } from "@/lib/types";

interface SensorDataPanelProps {
  environment: EnvironmentParams;
}

export function SensorDataPanel({ environment }: SensorDataPanelProps) {
  const sensors = [
    {
      label: "Humidity",
      value: `${environment.humidity}%`,
      icon: WiHumidity,
      accent: "from-sky-50 to-cyan-50 border-cyan-200/70",
      iconTone: "text-cyan-600",
    },
    {
      label: "Temperature",
      value: `${environment.temperature} °C`,
      icon: WiThermometer,
      accent: "from-orange-50 to-rose-50 border-orange-200/70",
      iconTone: "text-orange-600",
    },
    {
      label: "Light",
      value: `${environment.light} PPFD`,
      icon: FiSun,
      accent: "from-amber-50 to-yellow-50 border-amber-200/70",
      iconTone: "text-amber-600",
    },
    {
      label: "Soil Moisture",
      value: `${environment.soilMoisture}%`,
      icon: GiPlantWatering,
      accent: "from-emerald-50 to-teal-50 border-emerald-200/70",
      iconTone: "text-emerald-600",
    },
  ] as const;

  return (
    <Card className="h-[200px] overflow-hidden lg:h-[240px]" title="Initial Sensor Data" subtitle="Initial greenhouse conditions used to seed the hidden scenario.">
      <dl className="grid gap-1.5 sm:grid-cols-2">
        {sensors.map((sensor) => {
          const Icon = sensor.icon;

          return (
            <div
              key={sensor.label}
              className={`rounded-xl border bg-gradient-to-br p-2.5 shadow-[0_1px_1px_rgba(32,42,32,0.04)] ${sensor.accent}`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`rounded-lg bg-white/70 p-1.5 ${sensor.iconTone}`}>
                  <Icon aria-hidden="true" className="text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#667065]">{sensor.label}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-[#1F2A24]">{sensor.value}</dd>
                </div>
              </div>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
