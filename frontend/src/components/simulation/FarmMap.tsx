import { Card } from "@/components/layout/Card";
import type { Plant, Robot } from "@/lib/types";
import { MapLegend } from "./MapLegend";
import { PlantCell } from "./PlantCell";

interface FarmMapProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  plants?: Plant[];
  robots?: Robot[];
  rows?: number;
  cols?: number;
  showActualRiskOverlay?: boolean;
}

export function FarmMap({
  title = "Simulation Preview",
  subtitle = "Hidden ground-truth risk preview. The robot will start without access to this map.",
  placeholder = "Farm map preview placeholder",
  plants = [],
  robots = [],
  rows = 0,
  cols = 0,
  showActualRiskOverlay = false,
}: FarmMapProps) {
  const robotLocations = new Set(robots.map((robot) => `${robot.row}-${robot.col}`));

  return (
    <Card className="flex h-full min-h-[300px] flex-col overflow-hidden xl:min-h-0" title={title} subtitle={subtitle}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="relative flex min-h-[190px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-[#CFE0CA] bg-[#F0F6EA] p-3">
          {plants.length > 0 && rows > 0 && cols > 0 ? (
            <div
              aria-label={`${rows} by ${cols} real greenhouse grid`}
              className="grid w-full max-w-5xl gap-px"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {plants.map((plant) => (
                <PlantCell
                  key={plant.id}
                  plant={plant}
                  variant="real"
                  showActualRiskOverlay={showActualRiskOverlay}
                  hasRobot={robotLocations.has(`${plant.row}-${plant.col}`)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-[#667065]">{placeholder}</p>
          )}
        </div>
        <MapLegend variant="real" showActualRiskOverlay={showActualRiskOverlay} />
      </div>
    </Card>
  );
}
