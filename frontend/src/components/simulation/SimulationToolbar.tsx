import { FiEye, FiPause, FiPlay, FiRefreshCw, FiRepeat } from "react-icons/fi";

export function SimulationToolbar() {
  return (
    <section aria-label="Simulation controls" className="flex shrink-0 flex-col gap-3 rounded-xl border border-[#DDE5D8] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="flex items-center gap-2 rounded-lg border border-[#2E7D32] bg-[#2E7D32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#256629]">
          <FiPlay aria-hidden="true" />
          Run Agent Step
        </button>
        <button type="button" className="flex items-center gap-2 rounded-lg border border-[#BFD6BA] bg-[#EAF5EA] px-3 py-2 text-xs font-medium text-[#2E7D32]">
          <FiRepeat aria-hidden="true" />
          Auto Run
        </button>
        <button type="button" className="flex items-center gap-2 rounded-lg border border-[#CCD6C8] bg-white px-3 py-2 text-xs font-medium text-[#39463E]">
          <FiPause aria-hidden="true" />
          Pause
        </button>
        <button type="button" className="flex items-center gap-2 rounded-lg border border-[#CCD6C8] bg-white px-3 py-2 text-xs font-medium text-[#667065]">
          <FiRefreshCw aria-hidden="true" />
          Reset
        </button>
      </div>
      <button type="button" aria-pressed="false" className="flex items-center gap-3 self-start rounded-lg border border-[#CCD6C8] bg-[#FCFCF8] px-3 py-2 text-xs text-[#39463E] sm:self-auto">
        <FiEye aria-hidden="true" className="text-[#758074]" />
        Reveal Ground Truth
        <span className="relative h-4 w-7 rounded-full bg-[#D8DED4]">
          <span className="absolute left-0.5 top-0.5 size-3 rounded-full bg-white shadow-sm" />
        </span>
      </button>
    </section>
  );
}
