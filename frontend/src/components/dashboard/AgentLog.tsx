import { Card } from "@/components/layout/Card";

const logEntries = [
  { tick: "Tick 0", message: "Generated hidden disease scenario from greenhouse conditions." },
  { tick: "Tick 0", message: "ScoutBot-01 started with no plant health knowledge." },
  { tick: "Tick 1", message: "Agent selected next inspection target." },
  { tick: "Tick 2", message: "Robot captured image for CV classification." },
  { tick: "Tick 3", message: "Digital twin updated belief map." },
];

export function AgentLog() {
  return (
    <Card className="h-full overflow-hidden" title="Agent Log" subtitle="Autonomous scouting loop.">
      <ol className="space-y-1.5">
        {logEntries.map((entry, index) => (
          <li key={`${entry.tick}-${index}`} className="grid grid-cols-[42px_1fr] gap-2 text-[11px] leading-4">
            <span className="font-medium text-[#2E7D32]">{entry.tick}</span>
            <span className="text-[#667065]">{entry.message}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
