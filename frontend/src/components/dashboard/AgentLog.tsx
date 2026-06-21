import { Card } from "@/components/layout/Card";
import type { AgentLogEntry } from "@/lib/types";

interface AgentLogProps {
  entries: AgentLogEntry[];
}

export function AgentLog({ entries }: AgentLogProps) {
  return (
    <Card className="h-[200px] overflow-hidden lg:h-[240px]" title="Agent Log" subtitle="Autonomous scouting loop.">
      <div className="h-[200px] overflow-y-auto pr-1 sm:h-[220px] lg:h-[250px]">
        <ol className="space-y-1.5">
          {[...entries].reverse().map((entry) => (
            <li key={entry.id} className="grid grid-cols-[42px_1fr] gap-2 text-[11px] leading-4">
              <span className="font-medium text-[#2E7D32]">Tick {entry.tick}</span>
              <span className="text-[#667065]">{entry.message}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
