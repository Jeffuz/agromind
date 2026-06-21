import { Card } from "@/components/layout/Card";

export function RecommendationPanel() {
  return (
    <Card className="h-full overflow-hidden" title="Recommendation">
      <div className="flex h-full flex-col">
        <p className="text-base font-semibold text-emerald-300">Continue scouting</p>
        <p className="mt-1.5 text-xs leading-4 text-slate-400">
          Not enough confirmed evidence for treatment yet. The agent should inspect nearby uncertain plants before recommending intervention.
        </p>
        <p className="mt-2 border-l border-emerald-800 pl-3 text-[11px] leading-4 text-slate-300">
          Next best action: inspect the highest-risk unknown plant.
        </p>
        <button type="button" className="mt-2.5 self-start rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300">
          Confirm Next Step
        </button>
      </div>
    </Card>
  );
}
