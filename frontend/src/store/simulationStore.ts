"use client";

import { create } from "zustand";
import { generateGreenhouse } from "@/lib/diseaseMap";
import { calculateBeliefRisk, mockClassifyPlantImage } from "@/lib/cvAdapter";
import { calculateSimulationMetrics } from "@/lib/metrics";
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
  metrics: calculateSimulationMetrics([]),
  agentLogs: [],
  selectedPlantId: undefined,
  lastInspectedPlantId: undefined,
});

interface SimulationActions {
  setEnvironment: (environment: EnvironmentParams) => void;
  setRowsCols: (rows: number, cols: number) => void;
  setRobotCount: (robotCount: number) => void;
  applyScenario: (scenario: ScenarioPreset) => void;
  generateSimulation: () => void;
  toggleActualRiskOverlay: () => void;
  resetSimulation: () => void;
  selectPlant: (plantId: string) => void;
  clearSelectedPlant: () => void;
  inspectSelectedPlant: () => void;
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
      metrics: calculateSimulationMetrics(plants),
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
      selectedPlantId: undefined,
      lastInspectedPlantId: undefined,
    });
  },
  toggleActualRiskOverlay: () => set((current) => ({
    showActualRiskOverlay: !current.showActualRiskOverlay,
  })),
  resetSimulation: () => set(createInitialState()),
  selectPlant: (plantId) => set({ selectedPlantId: plantId }),
  clearSelectedPlant: () => set({ selectedPlantId: undefined }),
  inspectSelectedPlant: () => {
    const current = get();
    if (!current.selectedPlantId) return;

    const selectedIndex = current.plants.findIndex((plant) => plant.id === current.selectedPlantId);
    if (selectedIndex === -1) return;

    const selectedPlant = current.plants[selectedIndex];
    const { prediction, confidence } = mockClassifyPlantImage(selectedPlant);
    const priorRisk = selectedPlant.inspected ? selectedPlant.beliefRisk : 0.3;
    const beliefRisk = calculateBeliefRisk({ prediction, confidence, priorRisk });
    const nextTick = current.tick + 1;
    const updatedPlant = {
      ...selectedPlant,
      inspected: true,
      inspectedAtTick: nextTick,
      cvPrediction: prediction,
      cvConfidence: confidence,
      beliefLabel: prediction,
      beliefRisk,
    };
    const updatedPlants = current.plants.map((plant, index) => (index === selectedIndex ? updatedPlant : plant));
    const confidencePercent = Math.round(confidence * 100);

    set({
      tick: nextTick,
      plants: updatedPlants,
      metrics: calculateSimulationMetrics(updatedPlants),
      selectedPlantId: selectedPlant.id,
      lastInspectedPlantId: selectedPlant.id,
      agentLogs: [
        ...current.agentLogs,
        {
          id: `inspection-${selectedPlant.id}-${nextTick}`,
          tick: nextTick,
          message: `Inspected ${selectedPlant.id}. CV predicted ${prediction.replaceAll("_", " ")} with ${confidencePercent}% confidence.`,
        },
        {
          id: `belief-update-${selectedPlant.id}-${nextTick}`,
          tick: nextTick,
          message: "Belief map updated from captured leaf evidence.",
        },
      ],
      recommendation:
        prediction === "healthy"
          ? {
              title: "No treatment needed",
              body: "The inspected plant appears healthy. Continue scouting nearby plants.",
              nextAction: "Inspect adjacent plants around the healthy sample.",
            }
          : {
              title: "Targeted scouting recommended",
              body: "Disease signal detected. Prioritize neighboring plants before treatment.",
              nextAction: "Inspect adjacent plants around the detected signal.",
            },
    });
  },
}));

export const simulationActions = {
  setEnvironment: (environment: EnvironmentParams) => useSimulationStore.getState().setEnvironment(environment),
  setRowsCols: (rows: number, cols: number) => useSimulationStore.getState().setRowsCols(rows, cols),
  setRobotCount: (robotCount: number) => useSimulationStore.getState().setRobotCount(robotCount),
  applyScenario: (scenario: ScenarioPreset) => useSimulationStore.getState().applyScenario(scenario),
  generateSimulation: () => useSimulationStore.getState().generateSimulation(),
  toggleActualRiskOverlay: () => useSimulationStore.getState().toggleActualRiskOverlay(),
  resetSimulation: () => useSimulationStore.getState().resetSimulation(),
  selectPlant: (plantId: string) => useSimulationStore.getState().selectPlant(plantId),
  clearSelectedPlant: () => useSimulationStore.getState().clearSelectedPlant(),
  inspectSelectedPlant: () => useSimulationStore.getState().inspectSelectedPlant(),
};
