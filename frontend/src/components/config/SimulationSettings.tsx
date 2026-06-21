import { Card } from "@/components/layout/Card";

export function SimulationSettings() {
  return (
    <Card className="h-full overflow-hidden" title="Simulation Settings">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#667065]">Greenhouse Size</p>
          <div className="flex items-center justify-between rounded-xl border border-[#DDE5D8] bg-[#FCFCF8] px-3 py-2">
            <span className="text-xs font-medium text-[#1F2A24]">20 × 40</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#667065]">800 plants</p>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#667065]">Robot Count</p>
          <div className="flex items-center justify-between rounded-xl border border-[#DDE5D8] bg-[#FCFCF8] px-3 py-2">
            <span className="text-xs font-medium text-[#1F2A24]">1 robot</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#667065]">Recommended for MVP</p>
        </div>
      </div>
    </Card>
  );
}
