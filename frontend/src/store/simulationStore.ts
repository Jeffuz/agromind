"use client";

import { create } from "zustand";
import { generateGreenhouse } from "@/lib/diseaseMap";
import { calculateInitialMetrics } from "@/lib/metrics";
import type { EnvironmentParams, ScenarioPreset, SimulationState } from "@/lib/types";

export const defaultEnvironment: EnvironmentParams = {
  humidity: 78,
  temperature: 26.4,
  light: 420,
  soilMoisture: 28,
};

const createInitialState = (): SimulationState => ({
  phase: "config",
  tick: 0,
  rows: 20,
  cols: 40,
  robotCount: 1,
  environment: { ...defaultEnvironment },
  plants: [],
  robots: [],
  showActualRiskOverlay: false,
  metrics: calculateInitialMetrics([]),
  agentLogs: [],
});

interface SimulationActions {
  setEnvironment: (environment: EnvironmentParams) => void;
  setRowsCols: (rows: number, cols: number) => void;
  setRobotCount: (robotCount: number) => void;
  applyScenario: (scenario: ScenarioPreset) => void;
  generateSimulation: () => void;
  toggleActualRiskOverlay: () => void;
  resetSimulation: () => void;
}

type SimulationStore = SimulationState & SimulationActions;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...createInitialState(),
  setEnvironment: (environment) => set({ environment }),
  setRowsCols: (rows, cols) => set({ rows, cols }),
  setRobotCount: (robotCount) => set({ robotCount }),
  applyScenario: (scenario) => set({ environment: { ...scenario.environment } }),
  generateSimulation: () => {
    const current = get();
    const { plants, robots } = generateGreenhouse(current);
    set({
      phase: "dashboard",
      tick: 0,
      plants,
      robots,
      showActualRiskOverlay: false,
      metrics: calculateInitialMetrics(plants),
      agentLogs: [
        {
          id: "generated-0",
          tick: 0,
          message: "Hidden disease scenario generated from greenhouse conditions.",
        },
      ],
      recommendation: {
        title: "Ready to scout",
        body: "Start the agent loop to begin building the digital twin.",
        nextAction: "Run the first scouting step.",
      },
    });
  },
  toggleActualRiskOverlay: () => set((current) => ({
    showActualRiskOverlay: !current.showActualRiskOverlay,
  })),
  resetSimulation: () => set(createInitialState()),
}));

export const simulationActions = {
  setEnvironment: (environment: EnvironmentParams) => useSimulationStore.getState().setEnvironment(environment),
  setRowsCols: (rows: number, cols: number) => useSimulationStore.getState().setRowsCols(rows, cols),
  setRobotCount: (robotCount: number) => useSimulationStore.getState().setRobotCount(robotCount),
  applyScenario: (scenario: ScenarioPreset) => useSimulationStore.getState().applyScenario(scenario),
  generateSimulation: () => useSimulationStore.getState().generateSimulation(),
  toggleActualRiskOverlay: () => useSimulationStore.getState().toggleActualRiskOverlay(),
  resetSimulation: () => useSimulationStore.getState().resetSimulation(),
};
