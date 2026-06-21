import { Card } from "@/components/layout/Card";
import type { AgentLogEntry } from "@/lib/types";

interface AgentLogProps {
  entries: AgentLogEntry[];
}

export function AgentLog({ entries }: AgentLogProps) {
  return (
    <Card className="h-full overflow-hidden" title="Agent Log" subtitle="Autonomous scouting loop.">
      <ol className="space-y-1.5">
        {entries.map((entry) => (
          <li key={entry.id} className="grid grid-cols-[42px_1fr] gap-2 text-[11px] leading-4">
            <span className="font-medium text-[#2E7D32]">Tick {entry.tick}</span>
            <span className="text-[#667065]">{entry.message}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
