import { FiEye, FiLoader, FiPause, FiPlay, FiRefreshCw, FiRepeat } from "react-icons/fi";

interface SimulationToolbarProps {
  showActualRiskOverlay: boolean;
  agentRunning: boolean;
  isAutoRunning: boolean;
  onToggleActualRiskOverlay: () => void;
  onReset: () => void;
  onRunStep: () => void;
  onStartAutoRun: () => void;
  onStopAutoRun: () => void;
}

export function SimulationToolbar({
  showActualRiskOverlay,
  agentRunning,
  isAutoRunning,
  onToggleActualRiskOverlay,
  onReset,
  onRunStep,
  onStartAutoRun,
  onStopAutoRun,
}: SimulationToolbarProps) {
  return (
    <section aria-label="Simulation controls" className="flex shrink-0 flex-col gap-3 rounded-xl border border-[#DDE5D8] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRunStep}
          disabled={agentRunning || isAutoRunning}
          className="flex items-center gap-2 rounded-lg border border-[#2E7D32] bg-[#2E7D32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#256629] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {agentRunning ? <FiLoader aria-hidden="true" className="animate-spin" /> : <FiPlay aria-hidden="true" />}
          {agentRunning ? "Running…" : "Run Agent Step"}
        </button>

        <button
          type="button"
          onClick={isAutoRunning ? onStopAutoRun : onStartAutoRun}
          disabled={agentRunning && !isAutoRunning}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
            isAutoRunning
              ? "border-[#2E7D32] bg-[#2E7D32] text-white hover:bg-[#256629]"
              : "border-[#BFD6BA] bg-[#EAF5EA] text-[#2E7D32]"
          }`}
        >
          <FiRepeat aria-hidden="true" />
          {isAutoRunning ? "Stop Auto" : "Auto Run"}
        </button>

        <button
          type="button"
          onClick={onStopAutoRun}
          disabled={!isAutoRunning}
          className="flex items-center gap-2 rounded-lg border border-[#CCD6C8] bg-white px-3 py-2 text-xs font-medium text-[#39463E] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiPause aria-hidden="true" />
          Pause
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 rounded-lg border border-[#CCD6C8] bg-white px-3 py-2 text-xs font-medium text-[#667065]"
        >
          <FiRefreshCw aria-hidden="true" />
          Reset
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
