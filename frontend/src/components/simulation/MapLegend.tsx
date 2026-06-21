interface MapLegendProps {
  variant?: "real" | "belief";
  showActualRiskOverlay?: boolean;
}

const riskItems = [
  { label: "Low risk", color: "bg-green-200" },
  { label: "Medium risk", color: "bg-yellow-300" },
  { label: "High risk", color: "bg-orange-300" },
  { label: "Very high risk", color: "bg-[#D98A77]" },
];

export function MapLegend({ variant = "real", showActualRiskOverlay = false }: MapLegendProps) {
  const items = variant === "belief"
    ? [
        { label: "Unknown", color: "bg-[#E4E8E1]" },
        { label: "Inspected", color: "bg-[#D5E8D8]" },
        ...riskItems.slice(0, 3).map((item) => ({ ...item, label: item.label.replace("risk", "belief risk") })),
        { label: "Current target", color: "border-2 border-amber-600 bg-white" },
      ]
    : [
        { label: "Crop tile", color: "border border-[#968E73] bg-[#AFA486] shadow-inner" },
        { label: "Robot", color: "bg-white ring-1 ring-[#718078]" },
        { label: showActualRiskOverlay ? "Ground truth revealed" : "Ground truth hidden", color: "border border-dashed border-[#8B9788] bg-transparent" },
        ...riskItems,
      ];

  return (
    <aside className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed border-[#CCD6C8] bg-[#F8FAF5] px-3 py-2">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-[#667065]">
          <span className={`relative size-2.5 rounded-[2px] ${item.color}`}>
            {item.label === "Crop tile" && <span className="absolute inset-[25%] rounded-full bg-[#4F8B4C]" />}
            {item.label === "Robot" && <span className="absolute inset-x-[20%] inset-y-[30%] rounded-[1px] bg-[#748078]" />}
          </span>
          {item.label}
        </span>
      ))}
    </aside>
  );
}
