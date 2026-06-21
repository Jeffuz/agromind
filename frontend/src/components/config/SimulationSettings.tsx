"use client";

import { Card } from "@/components/layout/Card";
import { simulationActions, useSimulationStore } from "@/store/simulationStore";

export function SimulationSettings() {
  const rows = useSimulationStore((simulation) => simulation.rows);
  const cols = useSimulationStore((simulation) => simulation.cols);

  return (
    <Card className="h-full overflow-hidden" title="Simulation Settings">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[#667065]">Greenhouse Size</span>
          <select
            value={`${rows}x${cols}`}
            onChange={(event) => {
              const [nextRows, nextCols] = event.target.value.split("x").map(Number);
              simulationActions.setRowsCols(nextRows, nextCols);
            }}
            className="w-full rounded-xl border border-[#DDE5D8] bg-[#FCFCF8] px-3 py-2 text-xs font-medium text-[#1F2A24]"
          >
            <option value="10x20">10 × 20</option>
            <option value="20x40">20 × 40</option>
            <option value="30x50">30 × 50</option>
          </select>
          <span className="mt-1.5 block text-[11px] text-[#667065]">{rows * cols} plants</span>
        </label>
        <label>
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[#667065]">Robot Count</span>
          <div className="w-full rounded-xl border border-[#DDE5D8] bg-[#F3F5EF] px-3 py-2 text-xs font-medium text-[#1F2A24]">
            1 robot
          </div>
        </label>
      </div>
    </Card>
  );
}
