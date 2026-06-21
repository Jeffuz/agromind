import { Card } from "@/components/layout/Card";
import { MapLegend } from "./MapLegend";

interface FarmMapProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
}

export function FarmMap({
  title = "Simulation Preview",
  subtitle = "Hidden ground-truth risk preview. The robot will start without access to this map.",
  placeholder = "Farm map preview placeholder",
}: FarmMapProps) {
  return (
    <Card className="flex h-full min-h-[300px] flex-col overflow-hidden xl:min-h-0" title={title} subtitle={subtitle}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="relative flex min-h-[190px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-[#CFE0CA] bg-[#F0F6EA]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(79,157,93,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(79,157,93,0.10)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div className="relative px-6 text-center">
            <p className="text-sm font-medium text-[#667065]">{placeholder}</p>
          </div>
        </div>
        <MapLegend />
      </div>
    </Card>
  );
}
