import { Card } from "@/components/layout/Card";

const steps = [
  { number: "1", title: "Hidden disease map generated", description: "The environment values create a hidden ground-truth disease scenario." },
  { number: "2", title: "Robot starts with no knowledge", description: "The scout begins with an empty belief map." },
  { number: "3", title: "Digital twin updates during scouting", description: "Each inspection updates the agent’s belief map." },
];

export function WhatHappensNext() {
  return (
    <Card className="h-full overflow-hidden" title="What Happens Next?">
      <div className="relative">
        <div className="absolute left-4 top-3 bottom-3 w-px bg-[#DDE5D8]" aria-hidden="true" />
        <div className="grid gap-2.5">
          {steps.map((step, index) => (
            <div key={step.number} className="relative pl-11">
              <span className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full border border-[#BFD6BA] bg-[#EAF5EA] text-[11px] font-semibold text-[#2E7D32] shadow-sm">
                {step.number}
              </span>
              {index < steps.length - 1 && (
                <span className="absolute left-4 top-8 h-[calc(100%+0.4rem)] w-px bg-[#DDE5D8]" aria-hidden="true" />
              )}
              <div className="rounded-lg border border-[#E3E8DD] bg-[#FBFCF8] px-3 py-2">
                <h3 className="text-sm font-medium leading-5 text-[#1F2A24]">{step.title}</h3>
                <p className="mt-0.5 text-[11px] leading-4 text-[#667065]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
