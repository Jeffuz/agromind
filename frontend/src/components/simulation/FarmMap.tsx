"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/layout/Card";
import type { Plant, Robot } from "@/lib/types";
import { MapLegend } from "./MapLegend";

const GreenhouseScene3D = dynamic(
  () => import("./GreenhouseScene3D").then((module) => module.GreenhouseScene3D),
  { ssr: false, loading: () => <p className="text-sm text-[#667065]">Loading greenhouse view…</p> },
);

interface FarmMapProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  plants?: Plant[];
  robots?: Robot[];
  rows?: number;
  cols?: number;
  showActualRiskOverlay?: boolean;
}

export function FarmMap({
  title = "Simulation Preview",
  subtitle = "Hidden ground-truth risk preview. The robot will start without access to this map.",
  placeholder = "No greenhouse generated yet.",
  plants = [],
  robots = [],
  rows = 0,
  cols = 0,
  showActualRiskOverlay = false,
}: FarmMapProps) {
  const hasGreenhouse = plants.length > 0 && rows > 0 && cols > 0;

  return (
    <Card className="flex h-full min-h-[300px] flex-col overflow-hidden xl:min-h-0" title={title} subtitle={subtitle}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-[#756346] bg-[#8A7655]">
          {hasGreenhouse ? (
            <>
              <GreenhouseScene3D
                plants={plants}
                robots={robots}
                rows={rows}
                cols={cols}
                mode="real"
                showActualRiskOverlay={showActualRiskOverlay}
              />
              <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-white/80 px-2 py-1 text-[10px] text-[#667065] shadow-sm">
                Drag to rotate · Shift-drag to pan · Scroll to zoom
              </span>
            </>
          ) : (
            <p className="text-sm font-medium text-[#667065]">{placeholder}</p>
          )}
        </div>
        <MapLegend variant="real" showActualRiskOverlay={showActualRiskOverlay} />
      </div>
    </Card>
  );
}
