import { Card } from "@/components/layout/Card";
import { MapLegend } from "./MapLegend";

export function FarmMap() {
  return (
    <Card className="flex h-full min-h-[300px] flex-col overflow-hidden" title="Simulation Preview" subtitle="Hidden ground-truth risk preview. The robot will start without access to this map.">
      <div className="flex h-full min-h-0 flex-col">
      <div className="relative flex min-h-[210px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-emerald-900/50 bg-[#061010]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.045)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="relative flex flex-col items-center px-6 text-center">
          <p className="text-sm font-medium text-slate-400">Farm map preview placeholder</p>
        </div>
      </div>
      <MapLegend />
      </div>
    </Card>
  );
}
