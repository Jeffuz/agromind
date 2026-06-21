import type { Plant } from "@/lib/types";

interface PlantCellProps {
  plant?: Plant;
}

export function PlantCell({ plant }: PlantCellProps) {
  return <div>{plant ? `Plant ${plant.id}` : "Plant Cell"}</div>;
}
