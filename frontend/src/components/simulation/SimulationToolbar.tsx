import { FiEye, FiLoader, FiRepeat } from "react-icons/fi";
import type { AgentRunStatus, SimulationState } from "@/lib/types";

type AutoRunSpeed = SimulationState["autoRunSpeed"];

const speedOptions: ReadonlyArray<{ speed: AutoRunSpeed; label: string }> = [
  { speed: 1, label: "1x" },
  { speed: 2, label: "2x" },
  { speed: 4, label: "4x" },
  // { speed: 8, label: "8x" },
];

interface SimulationToolbarProps {
  showActualRiskOverlay: boolean;
  agentRunning: boolean;
  agentRunStatus: AgentRunStatus;
  isAutoRunning: boolean;
  autoRunSpeed: AutoRunSpeed;
  onToggleActualRiskOverlay: () => void;
  onStartAutoRun: () => void;
  onStopAutoRun: () => void;
  onSetAutoRunSpeed: (speed: AutoRunSpeed) => void;
}

export function SimulationToolbar({
  showActualRiskOverlay,
  agentRunning,
  agentRunStatus,
  isAutoRunning,
  autoRunSpeed,
  onToggleActualRiskOverlay,
  onStartAutoRun,
  onStopAutoRun,
  onSetAutoRunSpeed,
}: SimulationToolbarProps) {
  return (
    <section aria-label="Simulation controls" className="flex shrink-0 flex-col gap-3 rounded-xl border border-[#DDE5D8] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={isAutoRunning ? onStopAutoRun : onStartAutoRun}
          disabled={agentRunning && !isAutoRunning}
          className="flex h-9 items-center gap-2 rounded-lg border border-[#2E7D32] bg-[#2E7D32] px-4 text-xs font-semibold text-white hover:bg-[#256629] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {agentRunning ? <FiLoader aria-hidden="true" className="animate-spin" /> : <FiRepeat aria-hidden="true" />}
          {agentRunStatus === "complete" ? "Scouting complete" : isAutoRunning ? "Stop Auto Run" : "Auto Run"}
        </button>

        <div className="flex items-center gap-1 rounded-lg border border-[#DDE5D8] bg-[#F8FAF5] p-1">
          {speedOptions.map((option) => (
            <button
              key={option.speed}
              type="button"
              onClick={() => onSetAutoRunSpeed(option.speed)}
              aria-pressed={autoRunSpeed === option.speed}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                autoRunSpeed === option.speed
                  ? "bg-[#2E7D32] text-white"
                  : "text-[#526055] hover:bg-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-pressed={showActualRiskOverlay}
        onClick={onToggleActualRiskOverlay}
        className="flex items-center gap-3 self-start rounded-lg border border-[#CCD6C8] bg-[#FCFCF8] px-3 py-2 text-xs text-[#39463E] sm:self-auto"
      >
        <FiEye aria-hidden="true" className="text-[#758074]" />
        Reveal Ground Truth
        <span className={`relative h-4 w-7 rounded-full ${showActualRiskOverlay ? "bg-[#4F9D5D]" : "bg-[#D8DED4]"}`}>
          <span className={`absolute top-0.5 size-3 rounded-full bg-white shadow-sm transition-[left] ${showActualRiskOverlay ? "left-3.5" : "left-0.5"}`} />
        </span>
      </button>
    </section>
  );
}
