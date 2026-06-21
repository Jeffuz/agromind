import { Card } from "@/components/layout/Card";

const steps = [
  { number: "1", title: "Hidden disease map generated", description: "The environment values create a hidden ground-truth disease scenario." },
  { number: "2", title: "Robot starts with no knowledge", description: "The scout begins with an empty belief map." },
  { number: "3", title: "Digital twin updates during scouting", description: "Each inspection updates the agent’s belief map." },
];

export function WhatHappensNext() {
  return (
    <Card className="overflow-hidden" title="What Happens Next?">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {steps.map((step) => (
          <div key={step.number} className="border-l border-[#BFD6BA] pl-3">
            <span className="text-[10px] font-bold text-[#2E7D32]">{step.number}</span>
            <h3 className="mt-2 text-sm font-medium leading-5 text-[#1F2A24]">{step.title}</h3>
            <p className="mt-1 text-[11px] leading-4 text-[#667065]">{step.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
