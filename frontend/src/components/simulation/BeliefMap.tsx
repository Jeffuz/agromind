"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/layout/Card";
import type { Plant } from "@/lib/types";
import { MapLegend } from "./MapLegend";

const GreenhouseScene3D = dynamic(
  () => import("./GreenhouseScene3D").then((module) => module.GreenhouseScene3D),
  { ssr: false, loading: () => <p className="text-sm text-[#667065]">Loading belief view…</p> },
);

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
        <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-[#C9DDD6] bg-[#EEF3F0]">
          {plants.length > 0 ? (
            <>
              <GreenhouseScene3D plants={plants} rows={rows} cols={cols} mode="belief" />
              <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-white/80 px-2 py-1 text-[10px] text-[#667065] shadow-sm">
                Drag to rotate · Shift-drag to pan · Scroll to zoom
              </span>
            </>
          ) : (
            <p className="text-sm font-medium text-[#667065]">No greenhouse generated yet.</p>
          )}
        </div>
        <MapLegend variant="belief" />
      </div>
    </Card>
  );
}
