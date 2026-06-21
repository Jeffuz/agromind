import Image from "next/image";
import { Card } from "@/components/layout/Card";
import type { Plant } from "@/lib/types";

interface InspectionPanelProps {
  plant?: Plant;
  showActualRiskOverlay: boolean;
}

export function InspectionPanel({ plant, showActualRiskOverlay }: InspectionPanelProps) {
  return (
    <Card className="h-full overflow-hidden" title="Plant Inspection" subtitle="Inspect a plant in the real greenhouse to view its captured evidence.">
      {!plant ? (
        <p className="text-sm leading-6 text-[#667065]">Select a plant in the Real Greenhouse to view captured evidence.</p>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-1 text-sm">
            <p className="font-medium text-[#1F2A24]">{plant.id}</p>
            <p className="text-xs text-[#667065]">
              Row {plant.row + 1}, Column {plant.col + 1}
            </p>
            <p className="text-xs text-[#667065]">
              Status: {plant.inspected ? "inspected" : "not inspected yet"}
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#DDE5D8] bg-[#F7F9F4]">
            {plant.imageUrl ? (
              <Image
                src={plant.imageUrl}
                alt={`Captured tomato image for ${plant.id}`}
                width={480}
                height={270}
                className="h-36 w-full object-cover"
              />
            ) : (
              <div className="flex h-36 items-center justify-center text-xs text-[#667065]">No image available.</div>
            )}
          </div>

          <div className="grid gap-1 text-xs leading-5 text-[#667065]">
            <p>CV prediction: {plant.cvPrediction ? plant.cvPrediction.replaceAll("_", " ") : "CV not run yet"}</p>
            <p>Confidence: {plant.cvConfidence != null ? `${Math.round(plant.cvConfidence * 100)}%` : "N/A"}</p>
            <p>Inspected at tick: {plant.inspectedAtTick != null ? plant.inspectedAtTick : "N/A"}</p>
            {showActualRiskOverlay && (
              <>
                <p>Actual risk: {Math.round(plant.actualRisk * 100)}%</p>
                <p>True label: {plant.trueLabel.replaceAll("_", " ")}</p>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
