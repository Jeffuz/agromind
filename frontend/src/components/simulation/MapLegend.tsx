interface MapLegendProps {
  title?: string;
}

export function MapLegend({ title = "Legend placeholder" }: MapLegendProps) {
  return (
    <aside className="mt-3 flex items-center justify-between rounded-lg border border-dashed border-[#CCD6C8] bg-[#F8FAF5] px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wider text-[#7A8478]">Risk Legend</span>
      <span className="text-xs text-[#667065]">{title}</span>
    </aside>
  );
}
