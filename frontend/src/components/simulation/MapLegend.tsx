interface MapLegendProps {
  title?: string;
}

export function MapLegend({ title = "Map Legend" }: MapLegendProps) {
  return <aside>{title}</aside>;
}
