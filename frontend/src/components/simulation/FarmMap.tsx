import { MapLegend } from "./MapLegend";
import { PlantCell } from "./PlantCell";

export function FarmMap() {
  return (
    <section>
      <h2>Farm Map</h2>
      <PlantCell />
      <MapLegend />
    </section>
  );
}
