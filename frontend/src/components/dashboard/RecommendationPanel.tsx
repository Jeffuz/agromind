import { Card } from "@/components/layout/Card";
import type { Recommendation } from "@/lib/types";

interface RecommendationPanelProps {
  recommendation?: Recommendation;
}

export function RecommendationPanel({ recommendation }: RecommendationPanelProps) {
  return (
    <Card className="h-full overflow-hidden" title="Recommendation">
      {recommendation ? (
        <div className="flex h-full flex-col">
          <p className="text-base font-semibold text-[#2E7D32]">{recommendation.title}</p>
          <p className="mt-1.5 text-xs leading-4 text-[#667065]">{recommendation.body}</p>
          {recommendation.nextAction && (
            <p className="mt-2 border-l border-[#9FC79B] pl-3 text-[11px] leading-4 text-[#39463E]">
              Next best action: {recommendation.nextAction}
            </p>
          )}
          <button type="button" className="mt-2.5 self-start rounded-lg border border-[#BFD6BA] bg-[#EAF5EA] px-3 py-1.5 text-xs font-medium text-[#2E7D32] hover:bg-[#DDEEDD]">
            Confirm Next Step
          </button>
        </div>
      ) : (
        <p className="text-xs text-[#667065]">No recommendation available.</p>
      )}
    </Card>
  );
}
