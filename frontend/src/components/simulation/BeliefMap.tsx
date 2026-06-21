import { Card } from "@/components/layout/Card";
import type { Plant } from "@/lib/types";
import { MapLegend } from "./MapLegend";
import { PlantCell } from "./PlantCell";

interface BeliefMapProps {
  plants: Plant[];
  rows: number;
  cols: number;
}

export function BeliefMap({ plants, rows, cols }: BeliefMapProps) {
  return (
    <Card
      className="flex h-full min-h-[300px] flex-col overflow-hidden xl:min-h-0"
      title="Digital Twin Belief"
      subtitle="What the agent currently believes after scouting observations."
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="relative flex min-h-[190px] flex-1 items-center justify-center overflow-auto rounded-lg border border-[#C9DDD6] bg-[#EEF3EF] p-3 shadow-inner">
          <div
            aria-label={`${rows} by ${cols} digital twin belief grid`}
            className="grid w-full min-w-[620px] max-w-5xl gap-x-[2px] gap-y-[3px] rounded-md bg-[#D4DCD5] p-1.5 shadow-[inset_0_0_0_1px_rgba(95,112,101,0.12)] lg:min-w-0"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {plants.map((plant) => (
              <PlantCell key={plant.id} plant={plant} variant="belief" />
            ))}
          </div>
        </div>
        <MapLegend variant="belief" />
      </div>
    </Card>
  );
}
