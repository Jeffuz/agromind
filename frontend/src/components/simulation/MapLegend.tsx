interface MapLegendProps {
  title?: string;
}

export function MapLegend({ title = "Legend placeholder" }: MapLegendProps) {
  return (
    <aside className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-slate-700/70 bg-slate-950/20 px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-600">Risk Legend</span>
      <span className="text-xs text-slate-500">{title}</span>
    </aside>
  );
}
