import { MapLegend } from "./MapLegend";
import { PlantCell } from "./PlantCell";

export function BeliefMap() {
  return (
    <section>
      <h2>Belief Map</h2>
      <PlantCell />
      <MapLegend title="Belief Map Legend" />
    </section>
  );
}
