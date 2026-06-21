"use client";

import { create } from "zustand";
import { generateGreenhouse } from "@/lib/diseaseMap";
import { calculateBeliefRisk, mockClassifyPlantImage } from "@/lib/cvAdapter";
import { calculateSimulationMetrics } from "@/lib/metrics";
import { buildManhattanPath, scoreAgentTarget } from "@/lib/simulation";
import type { EnvironmentParams, ScenarioPreset, SimulationState } from "@/lib/types";

export const defaultEnvironment: EnvironmentParams = {
  humidity: 78,
  temperature: 26.4,
  light: 420,
  soilMoisture: 28,
};

let autoRunTimer: number | undefined;
const autoRunDelays = {
  idle: 200,
  moving: 125,
  processing: 850,
} as const;

function clearAutoRunTimer() {
  if (autoRunTimer !== undefined) {
    window.clearTimeout(autoRunTimer);
    autoRunTimer = undefined;
  }
}

function getAutoRunDelay(baseDelay: number, speed: 1 | 2 | 4 | 8) {
  return Math.max(35, Math.round(baseDelay / speed));
}

function scheduleAutoRunTick(delay: number) {
  clearAutoRunTimer();
  autoRunTimer = window.setTimeout(() => {
    const current = useSimulationStore.getState();
    if (!current.isAutoRunning) return;

    if (current.agentRunStatus === "idle") {
      current.runAgentStep();
      return;
    }

    if (current.agentRunStatus === "moving") {
      current.advanceRobotAlongPath();
      return;
    }

    if (current.agentRunStatus === "processing") {
      current.completeAgentInspection();
      return;
    }

    if (current.agentRunStatus === "complete") {
      current.stopAutoRun();
    }
  }, delay);
}

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
  agentRunStatus: "idle",
  isAutoRunning: false,
  autoRunSpeed: 1,
  activeRobotId: undefined,
  activeTargetPlantId: undefined,
  activePath: [],
  activePathIndex: 0,
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
  setAutoRunSpeed: (autoRunSpeed: 1 | 2 | 4 | 8) => void;
  resetSimulation: () => void;
  selectPlant: (plantId: string) => void;
  clearSelectedPlant: () => void;
  inspectSelectedPlant: () => void;
  runAgentStep: () => void;
  advanceRobotAlongPath: () => void;
  completeAgentInspection: () => void;
  cancelAgentRun: () => void;
  startAutoRun: () => void;
  stopAutoRun: () => void;
  toggleAutoRun: () => void;
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
    clearAutoRunTimer();
    set({
      phase: "dashboard",
      tick: 0,
      plants,
      robots,
      showActualRiskOverlay: false,
      agentRunStatus: "idle",
      isAutoRunning: false,
      activeRobotId: undefined,
      activeTargetPlantId: undefined,
      activePath: [],
      activePathIndex: 0,
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
  setAutoRunSpeed: (autoRunSpeed) => {
    const current = get();
    set({ autoRunSpeed });

    if (current.isAutoRunning) {
      scheduleAutoRunTick(
        current.agentRunStatus === "idle"
          ? getAutoRunDelay(autoRunDelays.idle, autoRunSpeed)
          : current.agentRunStatus === "moving"
            ? getAutoRunDelay(autoRunDelays.moving, autoRunSpeed)
            : current.agentRunStatus === "processing"
              ? getAutoRunDelay(autoRunDelays.processing, autoRunSpeed)
              : 0,
      );
    }
  },
  resetSimulation: () => {
    clearAutoRunTimer();
    set(createInitialState());
  },
  selectPlant: (plantId) => set({ selectedPlantId: plantId }),
  clearSelectedPlant: () => set({ selectedPlantId: undefined }),
  startAutoRun: () => {
    const current = get();
    if (current.isAutoRunning) return;
    set({ isAutoRunning: true });
    scheduleAutoRunTick(
      current.agentRunStatus === "idle"
        ? getAutoRunDelay(autoRunDelays.idle, current.autoRunSpeed)
        : 0,
    );
  },
  stopAutoRun: () => {
    clearAutoRunTimer();
    set({ isAutoRunning: false });
  },
  toggleAutoRun: () => {
    const current = get();
    if (current.isAutoRunning) {
      clearAutoRunTimer();
      set({ isAutoRunning: false });
      return;
    }

    set({ isAutoRunning: true });
    scheduleAutoRunTick(
      current.agentRunStatus === "idle"
        ? getAutoRunDelay(autoRunDelays.idle, current.autoRunSpeed)
        : 0,
    );
  },
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
  runAgentStep: () => {
    const current = get();
    if (current.agentRunStatus === "moving" || current.agentRunStatus === "processing") return;

    const robot = current.robots.find((item) => item.id === "robot-1") ?? current.robots[0];
    if (!robot) return;

    const uninspectedPlants = current.plants.filter((plant) => !plant.inspected);
    if (uninspectedPlants.length === 0) {
      set({
        agentRunStatus: "complete",
        isAutoRunning: false,
        activeRobotId: undefined,
        activeTargetPlantId: undefined,
        activePath: [],
        activePathIndex: 0,
        robots: current.robots.map((item) => ({ ...item, status: "idle", targetPlantId: undefined })),
        plants: current.plants.map((plant) => ({ ...plant, isCurrentTarget: false })),
        agentLogs: [
          ...current.agentLogs,
          {
            id: `agent-complete-${current.tick}`,
            tick: current.tick,
            message: "All plants have been inspected. Scouting complete.",
          },
        ],
      });
      clearAutoRunTimer();
      return;
    }

    const target = [...uninspectedPlants]
      .map((plant) => ({
        plant,
        score: scoreAgentTarget(plant, current.plants, robot, current.rows, current.cols),
      }))
      .sort((left, right) => right.score - left.score)[0]?.plant;

    if (!target) return;

    const path = buildManhattanPath({ row: robot.row, col: robot.col }, { row: target.row, col: target.col });
    const nextRobotStatus = path.length > 0 ? "moving" : "inspecting";

    set({
      agentRunStatus: path.length > 0 ? "moving" : "processing",
      activeRobotId: robot.id,
      activeTargetPlantId: target.id,
      activePath: path,
      activePathIndex: 0,
      robots: current.robots.map((item) => (
        item.id === robot.id
          ? { ...item, targetPlantId: target.id, status: nextRobotStatus }
          : item
      )),
      plants: current.plants.map((plant) => ({
        ...plant,
        isCurrentTarget: plant.id === target.id,
      })),
      agentLogs: [
        ...current.agentLogs,
        {
          id: `agent-plan-${target.id}-${current.tick}`,
          tick: current.tick,
          message: `Agent planned a route to ${target.id}.`,
        },
        {
          id: `agent-move-${target.id}-${current.tick}`,
          tick: current.tick,
          message: "Robot moving to target plant.",
        },
      ],
    });

    if (current.isAutoRunning) {
      scheduleAutoRunTick(
        path.length > 0
          ? getAutoRunDelay(autoRunDelays.moving, current.autoRunSpeed)
          : getAutoRunDelay(autoRunDelays.processing, current.autoRunSpeed),
      );
    }
  },
  advanceRobotAlongPath: () => {
    const current = get();
    if (current.agentRunStatus !== "moving") return;
    const robotId = current.activeRobotId;
    const targetPlantId = current.activeTargetPlantId;
    if (!robotId || !targetPlantId) return;

    const nextPosition = current.activePath[current.activePathIndex];
    if (!nextPosition) {
      set({
        agentRunStatus: "processing",
        robots: current.robots.map((item) => (
          item.id === robotId ? { ...item, status: "inspecting", targetPlantId } : item
        )),
        agentLogs: [
          ...current.agentLogs,
          {
            id: `agent-arrive-${targetPlantId}-${current.tick}`,
            tick: current.tick,
            message: `Robot arrived at ${targetPlantId} and is processing the captured image.`,
          },
        ],
      });
      return;
    }

    const nextIndex = current.activePathIndex + 1;
    const isLastStep = nextIndex >= current.activePath.length;

    set({
      robots: current.robots.map((item) => (
        item.id === robotId
          ? {
              ...item,
              row: nextPosition.row,
              col: nextPosition.col,
              targetPlantId,
              status: isLastStep ? "inspecting" : "moving",
            }
          : item
      )),
      activePathIndex: nextIndex,
      agentRunStatus: isLastStep ? "processing" : "moving",
      agentLogs: isLastStep
        ? [
            ...current.agentLogs,
            {
              id: `agent-arrive-${targetPlantId}-${current.tick}`,
              tick: current.tick,
              message: `Robot arrived at ${targetPlantId} and is processing the captured image.`,
            },
          ]
        : current.agentLogs,
    });

    if (current.isAutoRunning) {
      scheduleAutoRunTick(
        isLastStep
          ? getAutoRunDelay(autoRunDelays.processing, current.autoRunSpeed)
          : getAutoRunDelay(autoRunDelays.moving, current.autoRunSpeed),
      );
    }
  },
  completeAgentInspection: () => {
    const current = get();
    if (current.agentRunStatus !== "processing") return;
    const targetId = current.activeTargetPlantId;
    const robotId = current.activeRobotId;
    if (!targetId) return;

    const selectedIndex = current.plants.findIndex((plant) => plant.id === targetId);
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
      isCurrentTarget: false,
    };
    const updatedPlants = current.plants.map((plant, index) => (index === selectedIndex ? updatedPlant : { ...plant, isCurrentTarget: false }));
    const confidencePercent = Math.round(confidence * 100);
    const remainingUninspected = updatedPlants.some((plant) => !plant.inspected);

    set({
      tick: nextTick,
      plants: updatedPlants,
      robots: current.robots.map((item) => (
        item.id === robotId
          ? { ...item, status: "idle", targetPlantId: undefined }
          : item
      )),
      metrics: calculateSimulationMetrics(updatedPlants),
      lastInspectedPlantId: targetId,
      activeRobotId: undefined,
      activeTargetPlantId: undefined,
      activePath: [],
      activePathIndex: 0,
      agentRunStatus: remainingUninspected ? "idle" : "complete",
      isAutoRunning: remainingUninspected ? current.isAutoRunning : false,
      agentLogs: [
        ...current.agentLogs,
        {
          id: `inspection-${targetId}-${nextTick}`,
          tick: nextTick,
          message: `CV predicted ${prediction.replaceAll("_", " ")} with ${confidencePercent}% confidence.`,
        },
        {
          id: `belief-update-${targetId}-${nextTick}`,
          tick: nextTick,
          message: "Digital twin belief updated.",
        },
        ...(remainingUninspected
          ? []
          : [
              {
                id: `agent-complete-${targetId}-${nextTick}`,
                tick: nextTick,
                message: "All plants have been inspected. Scouting complete.",
              },
            ]),
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

    if (remainingUninspected) {
      if (current.isAutoRunning) {
        scheduleAutoRunTick(getAutoRunDelay(autoRunDelays.idle, current.autoRunSpeed));
      }
    } else {
      clearAutoRunTimer();
    }
  },
  cancelAgentRun: () => {
    const current = get();
    clearAutoRunTimer();
    set({
      agentRunStatus: "idle",
      isAutoRunning: false,
      activeRobotId: undefined,
      activeTargetPlantId: undefined,
      activePath: [],
      activePathIndex: 0,
      robots: current.robots.map((item) => ({ ...item, status: "idle", targetPlantId: undefined })),
      plants: current.plants.map((plant) => ({ ...plant, isCurrentTarget: false })),
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
  setAutoRunSpeed: (autoRunSpeed: 1 | 2 | 4 | 8) => useSimulationStore.getState().setAutoRunSpeed(autoRunSpeed),
  resetSimulation: () => useSimulationStore.getState().resetSimulation(),
  selectPlant: (plantId: string) => useSimulationStore.getState().selectPlant(plantId),
  clearSelectedPlant: () => useSimulationStore.getState().clearSelectedPlant(),
  inspectSelectedPlant: () => useSimulationStore.getState().inspectSelectedPlant(),
  runAgentStep: () => useSimulationStore.getState().runAgentStep(),
  advanceRobotAlongPath: () => useSimulationStore.getState().advanceRobotAlongPath(),
  completeAgentInspection: () => useSimulationStore.getState().completeAgentInspection(),
  cancelAgentRun: () => useSimulationStore.getState().cancelAgentRun(),
  startAutoRun: () => useSimulationStore.getState().startAutoRun(),
  stopAutoRun: () => useSimulationStore.getState().stopAutoRun(),
  toggleAutoRun: () => useSimulationStore.getState().toggleAutoRun(),
};
