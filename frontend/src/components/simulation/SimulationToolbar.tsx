import { FiEye, FiPause, FiPlay, FiRefreshCw, FiRepeat } from "react-icons/fi";

export function SimulationToolbar() {
  return (
    <section aria-label="Simulation controls" className="flex shrink-0 flex-col gap-3 rounded-xl border border-slate-800 bg-[#0b1516] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="flex items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950">
          <FiPlay aria-hidden="true" />
          Run Agent Step
        </button>
        <button type="button" className="flex items-center gap-2 rounded-lg border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-xs font-medium text-emerald-300">
          <FiRepeat aria-hidden="true" />
          Auto Run
        </button>
        <button type="button" className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300">
          <FiPause aria-hidden="true" />
          Pause
        </button>
        <button type="button" className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400">
          <FiRefreshCw aria-hidden="true" />
          Reset
        </button>
      </div>
      <button type="button" aria-pressed="false" className="flex items-center gap-3 self-start rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 sm:self-auto">
        <FiEye aria-hidden="true" className="text-slate-500" />
        Reveal Ground Truth
        <span className="relative h-4 w-7 rounded-full bg-slate-700">
          <span className="absolute left-0.5 top-0.5 size-3 rounded-full bg-slate-400" />
        </span>
      </button>
    </section>
  );
}
