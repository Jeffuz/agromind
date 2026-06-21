import { FiAlertOctagon, FiAlertTriangle, FiCheckCircle, FiCpu, FiZap } from "react-icons/fi";
import { Card } from "@/components/layout/Card";
import type { AgentAnalysis, Recommendation } from "@/lib/types";

interface RecommendationPanelProps {
  recommendation?: Recommendation;
  agentAnalysis?: AgentAnalysis;
}

function riskLevel(title: string): "high" | "medium" | "healthy" | "neutral" {
  const t = title.toLowerCase();
  if (t.includes("late") || t.includes("high")) return "high";
  if (t.includes("early") || t.includes("disease") || t.includes("detected")) return "medium";
  if (t.includes("healthy") || t.includes("no treatment")) return "healthy";
  return "neutral";
}

const RISK_STYLES = {
  high:    { icon: FiAlertOctagon,  iconColor: "text-red-500",     bg: "bg-red-50",     border: "border-red-200",    title: "text-red-700" },
  medium:  { icon: FiAlertTriangle, iconColor: "text-orange-500",  bg: "bg-orange-50",  border: "border-orange-200", title: "text-orange-700" },
  healthy: { icon: FiCheckCircle,   iconColor: "text-[#2E7D32]",   bg: "bg-[#EAF5EA]", border: "border-[#BFD6BA]",  title: "text-[#2E7D32]" },
  neutral: { icon: FiCpu,           iconColor: "text-[#667065]",   bg: "bg-[#F5F7EF]", border: "border-[#DDE5D8]",  title: "text-[#1F2A24]" },
};

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9DACA0]">{label}</p>
      <p className="mt-0.5 text-xs leading-4 text-[#39463E]">{text}</p>
    </div>
  );
}

export function RecommendationPanel({ recommendation, agentAnalysis }: RecommendationPanelProps) {
  const isAgentAnalysis = recommendation?.title === "Fetch.ai Agent Analysis";
  const level = recommendation ? riskLevel(recommendation.title) : "neutral";
  const style = RISK_STYLES[level];
  const Icon = style.icon;

  return (
    <Card
      className="h-full overflow-hidden"
      title="Recommendation"
      subtitle={isAgentAnalysis ? undefined : "From the autonomous scouting agent."}
    >
      {!recommendation ? (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <FiCpu className="text-2xl text-[#9FC79B]" />
            <p className="text-xs text-[#9DACA0]">Waiting for first agent step.</p>
          </div>
        </div>
      ) : isAgentAnalysis && agentAnalysis ? (
        // ── Fetch.ai agent full analysis ────────────────────────────────────
        <div className="flex h-full flex-col gap-2 overflow-y-auto pr-0.5">
          <div className="flex items-center gap-1.5">
            <FiZap className="text-[11px] text-purple-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600">Fetch.ai Agent</span>
            {agentAnalysis.agent_address && (
              <span className="ml-auto rounded bg-purple-50 px-1.5 py-0.5 font-mono text-[9px] text-purple-400">
                {agentAnalysis.agent_address.slice(0, 12)}…
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {agentAnalysis.overview && <Section label="Overview" text={agentAnalysis.overview} />}
            {agentAnalysis.high_risk_areas && <Section label="High-risk areas" text={agentAnalysis.high_risk_areas} />}
            {agentAnalysis.healthy_areas && <Section label="Healthy areas" text={agentAnalysis.healthy_areas} />}
            {agentAnalysis.unvisited_areas && <Section label="Unvisited" text={agentAnalysis.unvisited_areas} />}
            {agentAnalysis.recommendations && (
              <div className="rounded-lg border border-[#BFD6BA] bg-[#EAF5EA] p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2E7D32]">Action plan</p>
                <p className="mt-0.5 text-xs leading-4 text-[#39463E]">{agentAnalysis.recommendations}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ── Per-step recommendation ──────────────────────────────────────────
        <div className="flex h-full flex-col gap-2.5">
          <div className={`flex items-start gap-2.5 rounded-lg border p-2.5 ${style.bg} ${style.border}`}>
            <Icon className={`mt-0.5 shrink-0 text-sm ${style.iconColor}`} />
            <div>
              <p className={`text-xs font-semibold leading-4 ${style.title}`}>{recommendation.title}</p>
              <p className="mt-0.5 text-xs leading-4 text-[#39463E]">{recommendation.body}</p>
            </div>
          </div>

          {recommendation.nextAction && (
            <div className="border-l-2 border-[#9FC79B] pl-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9DACA0]">Next action</p>
              <p className="mt-0.5 text-xs leading-4 text-[#39463E]">{recommendation.nextAction}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
