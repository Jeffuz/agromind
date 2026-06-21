import type { CSSProperties } from "react";
import type { Plant } from "@/lib/types";

interface PlantCellProps {
  plant: Plant;
  variant: "real" | "belief";
  showActualRiskOverlay?: boolean;
  hasRobot?: boolean;
}

const soilColors = ["#AAA080", "#B2A789", "#A39B7D", "#B7AC8E"];
const leafPalettes = [
  ["#2F6F3B", "#4F8B4C", "#78A864"],
  ["#356E3D", "#5A914F", "#83AE6D"],
  ["#2C6738", "#4B8247", "#6FA15E"],
];

function getRiskLevel(risk: number) {
  if (risk < 0.3) return "low";
  if (risk < 0.55) return "medium";
  if (risk < 0.78) return "high";
  return "very high";
}

function getRiskOverlay(risk: number) {
  if (risk < 0.3) return "bg-green-500/10";
  if (risk < 0.55) return "bg-yellow-400/30";
  if (risk < 0.78) return "bg-orange-400/35";
  return "bg-[#C85D45]/45";
}

function getBeliefSurface(plant: Plant) {
  if (plant.beliefLabel === "unknown") return "border-[#C8CEC4] bg-[#E3E7E0]";
  if (plant.beliefRisk < 0.3) return "border-[#A8C8AC] bg-[#DDEBDD]";
  return "border-[#9FBEA4] bg-[#D7E7D7]";
}

export function PlantCell({ plant, variant, showActualRiskOverlay = false, hasRobot = false }: PlantCellProps) {
  const variation = (plant.row * 7 + plant.col * 11) % soilColors.length;
  const palette = leafPalettes[(plant.row * 5 + plant.col * 3) % leafPalettes.length];
  const rotation = ((plant.row * 13 + plant.col * 17) % 19) - 9;
  const scale = 0.82 + ((plant.row * 3 + plant.col * 7) % 5) * 0.035;
  const textureX = 20 + ((plant.row * 11 + plant.col * 7) % 60);
  const textureY = 20 + ((plant.row * 5 + plant.col * 13) % 60);
  const isBelief = variant === "belief";
  const isUnknown = isBelief && plant.beliefLabel === "unknown";
  const displayedRisk = isBelief ? plant.beliefRisk : plant.actualRisk;
  const showRisk = isBelief ? plant.beliefLabel !== "unknown" : showActualRiskOverlay;
  const stateLabel = isBelief
    ? isUnknown ? "unknown" : `${getRiskLevel(plant.beliefRisk)} belief risk`
    : showActualRiskOverlay ? `${getRiskLevel(plant.actualRisk)} actual risk, ${plant.trueLabel.replaceAll("_", " ")}` : "ground truth hidden";
  const soilStyle: CSSProperties | undefined = isBelief
    ? undefined
    : {
        backgroundColor: soilColors[variation],
        backgroundImage: `radial-gradient(circle at ${textureX}% ${textureY}%, rgba(77, 68, 48, 0.18) 0 5%, transparent 7%), linear-gradient(145deg, rgba(255,255,255,0.12), rgba(74,65,45,0.08))`,
      };

  return (
    <div
      aria-label={`${plant.id}, ${stateLabel}${hasRobot ? ", robot present" : ""}`}
      style={soilStyle}
      className={`relative aspect-square min-w-0 overflow-visible rounded-[3px] border shadow-[inset_0_-2px_2px_rgba(63,55,39,0.16),0_1px_1px_rgba(71,88,63,0.14)] ${
        isBelief ? getBeliefSurface(plant) : "border-[#968E73]"
      } ${plant.isCurrentTarget ? "z-10 ring-2 ring-[#D97706] ring-offset-1" : ""}`}
    >
      <span className={`absolute inset-0 z-[2] rounded-[2px] ${showRisk ? getRiskOverlay(displayedRisk) : "bg-transparent"}`} />

      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`absolute inset-[7%] z-[3] h-[86%] w-[86%] drop-shadow-[0_1px_1px_rgba(37,60,34,0.32)] ${isUnknown ? "opacity-20 grayscale" : "opacity-95"}`}
        style={{ transform: `rotate(${rotation}deg) scale(${scale})` }}
      >
        <ellipse cx="12" cy="7.1" rx="2.8" ry="6.1" fill={palette[1]} transform="rotate(-4 12 12)" />
        <ellipse cx="8.1" cy="10" rx="2.7" ry="5.6" fill={palette[0]} transform="rotate(-58 8.1 10)" />
        <ellipse cx="15.9" cy="10" rx="2.7" ry="5.6" fill={palette[2]} transform="rotate(58 15.9 10)" />
        <ellipse cx="9.2" cy="14.8" rx="2.6" ry="5" fill={palette[2]} transform="rotate(-126 9.2 14.8)" />
        <ellipse cx="14.8" cy="14.8" rx="2.6" ry="5" fill={palette[0]} transform="rotate(126 14.8 14.8)" />
        <circle cx="12" cy="12" r="2.1" fill="#315F35" />
        <path d="M12 6.2v11.5M6.5 10.1l11 4M17.5 10.1l-11 4" stroke="#A7C78E" strokeWidth="0.45" strokeLinecap="round" opacity="0.65" />
      </svg>

      {plant.inspected && isBelief && (
        <span className="absolute right-[7%] top-[7%] z-10 size-[24%] rounded-full border border-white bg-[#2E7D32]" />
      )}

      {hasRobot && (
        <svg
          aria-hidden="true"
          viewBox="0 0 28 22"
          className="absolute left-1/2 top-1/2 z-30 h-[92%] w-[112%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_2px_rgba(40,48,42,0.45)]"
        >
          <rect x="1" y="4" width="4" height="14" rx="2" fill="#4F5853" />
          <rect x="23" y="4" width="4" height="14" rx="2" fill="#4F5853" />
          <rect x="4" y="2.5" width="20" height="17" rx="4" fill="#F4F5F2" stroke="#748078" strokeWidth="1.2" />
          <rect x="8" y="6" width="12" height="9" rx="2.5" fill="#D8DFDA" stroke="#A7B0AA" strokeWidth="0.7" />
          <circle cx="14" cy="10.5" r="2.5" fill="#3F7054" />
          <circle cx="14" cy="10.5" r="1" fill="#A9D0B5" />
          <path d="M9 17h10" stroke="#89948D" strokeWidth="1" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
