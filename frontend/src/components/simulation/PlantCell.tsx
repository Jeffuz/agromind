import type { Plant } from "@/lib/types";

interface PlantCellProps {
  plant: Plant;
  variant: "real" | "belief";
  showActualRiskOverlay?: boolean;
  hasRobot?: boolean;
}

function getCellColor(plant: Plant, variant: "real" | "belief", showActualRiskOverlay: boolean) {
  if (variant === "belief") {
    if (plant.beliefLabel === "unknown") return "border-[#D8DED4] bg-[#E9ECE5]";
    if (plant.beliefRisk < 0.35) return "border-green-300 bg-green-200";
    if (plant.beliefRisk < 0.65) return "border-amber-300 bg-amber-200";
    return "border-red-300 bg-red-200";
  }

  if (!showActualRiskOverlay) return "border-[#BFD6BA] bg-[#CFE8C9]";
  if (plant.actualRisk < 0.35) return "border-green-400 bg-green-300";
  if (plant.actualRisk < 0.65) return "border-amber-400 bg-amber-300";
  return "border-red-400 bg-red-300";
}

export function PlantCell({ plant, variant, showActualRiskOverlay = false, hasRobot = false }: PlantCellProps) {
  const label = variant === "belief" ? plant.beliefLabel : showActualRiskOverlay ? plant.trueLabel : "hidden";

  return (
    <div
      title={`${plant.id}: ${label}`}
      className={`relative aspect-square min-w-0 rounded-[2px] border ${getCellColor(plant, variant, showActualRiskOverlay)}`}
    >
      {hasRobot && (
        <span className="absolute inset-[-2px] z-10 flex items-center justify-center rounded-sm bg-[#245B3A] text-[6px] font-bold leading-none text-white ring-1 ring-white">
          R
        </span>
      )}
    </div>
  );
}
