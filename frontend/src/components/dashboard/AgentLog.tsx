import { FiAlertTriangle, FiCheck, FiCheckCircle, FiCpu, FiInfo, FiNavigation, FiZap, FiXCircle } from "react-icons/fi";
import type { IconType } from "react-icons";
import { Card } from "@/components/layout/Card";
import type { AgentLogEntry } from "@/lib/types";

interface AgentLogProps {
  entries: AgentLogEntry[];
}

type LogKind = "thought" | "move" | "cv-disease" | "cv-healthy" | "done" | "error" | "info";

function classifyEntry(message: string): LogKind {
  if (message.startsWith("__thought__")) return "thought";
  if (message.startsWith("MDP →")) return "move";
  if (message.startsWith("CV:")) return message.includes("healthy") ? "cv-healthy" : "cv-disease";
  if (message.toLowerCase().includes("failed") || message.toLowerCase().includes("error")) return "error";
  if (message.includes("complete") || message.includes("All plants") || message.includes("Scouting")) return "done";
  return "info";
}

function formatMessage(message: string, kind: LogKind): { primary: string; secondary?: string } {
  if (kind === "thought") {
    return { primary: message.replace("__thought__ ", "") };
  }
  if (kind === "move") {
    const match = message.match(/MDP → (\w+) to \((\d+), (\d+)\)\. (.+)/);
    if (match) return { primary: `Move ${match[1]} → row ${match[2]}, col ${match[3]}`, secondary: match[4].replace(/\.$/, "") };
  }
  if (kind === "cv-healthy" || kind === "cv-disease") {
    const match = message.match(/CV: (.+?) · (\d+)% confidence · belief risk ([\d.]+)/);
    if (match) return { primary: match[1].replace(/_/g, " "), secondary: `${match[2]}% confidence · risk ${match[3]}` };
  }
  return { primary: message };
}

const KIND_STYLES: Record<LogKind, { icon: IconType; dot: string; label: string; labelColor: string; textColor: string }> = {
  thought:      { icon: FiZap,           dot: "bg-purple-400",  label: "Fetch.ai",  labelColor: "text-purple-600", textColor: "text-purple-900" },
  move:         { icon: FiNavigation,    dot: "bg-[#4F9D5D]",   label: "Move",      labelColor: "text-[#2E7D32]",  textColor: "text-[#1F2A24]" },
  "cv-healthy": { icon: FiCheck,         dot: "bg-[#4F9D5D]",   label: "Healthy",   labelColor: "text-[#2E7D32]",  textColor: "text-[#1F2A24]" },
  "cv-disease": { icon: FiAlertTriangle, dot: "bg-[#D97706]",   label: "Disease",   labelColor: "text-[#D97706]",  textColor: "text-[#1F2A24]" },
  done:         { icon: FiCheckCircle,   dot: "bg-[#4F9D5D]",   label: "Done",      labelColor: "text-[#2E7D32]",  textColor: "text-[#1F2A24]" },
  error:        { icon: FiXCircle,       dot: "bg-red-500",     label: "Error",     labelColor: "text-red-600",    textColor: "text-red-700" },
  info:         { icon: FiInfo,          dot: "bg-[#9FC79B]",   label: "Info",      labelColor: "text-[#667065]",  textColor: "text-[#39463E]" },
};

export function AgentLog({ entries }: AgentLogProps) {
  const reversed = [...entries].reverse();

  return (
    <Card
      className="h-[200px] overflow-hidden lg:h-[240px]"
      title="Agent Log"
      subtitle="Autonomous scouting loop."
    >
      <div className="h-[200px] overflow-y-auto pr-1 sm:h-[220px] lg:h-[250px]">
        {reversed.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <FiCpu className="text-2xl text-[#9FC79B]" />
              <p className="text-xs text-[#9DACA0]">Agent hasn&apos;t started yet.<br />Press Run Agent Step to begin.</p>
            </div>
          </div>
        ) : (
          <ol className="space-y-2">
            {reversed.map((entry) => {
              const kind = classifyEntry(entry.message);
              const style = KIND_STYLES[kind];
              const Icon = style.icon;
              const { primary, secondary } = formatMessage(entry.message, kind);
              const isThought = kind === "thought";

              return (
                <li key={entry.id} className={`flex gap-2.5 ${isThought ? "rounded-lg bg-purple-50 p-2" : ""}`}>
                  <div className="mt-0.5 flex shrink-0 flex-col items-center gap-1">
                    <span className={`flex size-5 items-center justify-center rounded-full ${style.dot} bg-opacity-20`}>
                      <Icon className={`text-[10px] ${style.labelColor}`} />
                    </span>
                    {!isThought && <span className="w-px flex-1 bg-[#EEF2E8]" />}
                  </div>
                  <div className={isThought ? "" : "pb-2"}>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${style.labelColor}`}>{style.label}</span>
                      <span className="text-[10px] text-[#9DACA0]">t{entry.tick}</span>
                    </div>
                    <p className={`text-xs leading-4 ${style.textColor}`}>{primary}</p>
                    {secondary && <p className="text-[11px] leading-4 text-[#667065]">{secondary}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}
