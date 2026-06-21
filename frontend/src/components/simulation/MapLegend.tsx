interface MapLegendProps {
  variant?: "real" | "belief";
  showActualRiskOverlay?: boolean;
}

const riskItems = [
  { label: "Low risk", color: "bg-green-300" },
  { label: "Medium risk", color: "bg-amber-300" },
  { label: "High risk", color: "bg-red-300" },
];

export function MapLegend({ variant = "real", showActualRiskOverlay = false }: MapLegendProps) {
  const items = variant === "belief"
    ? [
        { label: "Unknown", color: "bg-[#E1E5DE]" },
        { label: "Inspected", color: "bg-[#B9D7C1]" },
        ...riskItems.map((item) => ({ ...item, label: item.label.replace("risk", "belief risk") })),
      ]
    : [
        { label: "Plant", color: "bg-[#CFE8C9]" },
        { label: "Robot", color: "bg-[#245B3A]" },
        ...(showActualRiskOverlay
          ? riskItems
          : [{ label: "Risk hidden", color: "bg-[#E9ECE5]" }]),
      ];

  return (
    <aside className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed border-[#CCD6C8] bg-[#F8FAF5] px-3 py-2">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-[#667065]">
          <span className={`size-2 rounded-[2px] border border-black/10 ${item.color}`} />
          {item.label}
        </span>
      ))}
    </aside>
  );
}
