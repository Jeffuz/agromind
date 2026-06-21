"use client";

import { create } from "zustand";
import { generateGreenhouse } from "@/lib/diseaseMap";
import { calculateBeliefRisk, mockClassifyPlantImage } from "@/lib/cvAdapter";
import { calculateSimulationMetrics } from "@/lib/metrics";
import type { AgentAnalysis, AgentLogEntry, EnvironmentParams, Plant, ScenarioPreset, SimulationState } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

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
  agentRunning: false,
  isAutoRunning: false,
  agentAnalysis: undefined,
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
  runAgentStep: () => Promise<void>;
  startAutoRun: () => void;
  stopAutoRun: () => void;
  analyzeWithAgent: () => Promise<void>;
}

type SimulationStore = SimulationState & SimulationActions;

// Module-level handles so they survive re-renders
let _autoRunInterval: ReturnType<typeof setInterval> | null = null;
let _analyzeInFlight = false;

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
      agentRunning: false,
      isAutoRunning: false,
      agentAnalysis: undefined,
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

  resetSimulation: () => {
    if (_autoRunInterval) {
      clearInterval(_autoRunInterval);
      _autoRunInterval = null;
    }
    set(createInitialState());
  },

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

  runAgentStep: async () => {
    const current = get();
    if (current.agentRunning) return;

    const { plants, robots, rows, cols, tick } = current;
    const robot = robots[0];
    if (!robot) return;

    // Check if all plants are visited — trigger Fetch.ai analysis
    if (plants.every((p) => p.inspected)) {
      get().stopAutoRun();
      const doneTick = tick;
      set({
        agentLogs: [
          ...get().agentLogs,
          { id: `done-${doneTick}`, tick: doneTick, message: "All plants inspected. Requesting Fetch.ai farm analysis…" },
        ],
        recommendation: { title: "Fetch.ai agent analysing…", body: "Please wait while the agent reasons over the full farm scan.", },
      });
      _requestAgentAnalysis(plants, rows, cols, doneTick);
      return;
    }

    set({ agentRunning: true });

    // Build lookup map for O(1) access
    const plantMap = new Map(plants.map((p) => [`${p.row}-${p.col}`, p]));

    // Effective grid: 1.1 sentinel for unvisited, beliefRisk for visited
    const beliefGrid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const plant = plantMap.get(`${r}-${c}`);
        return plant?.inspected ? plant.beliefRisk : 1.1;
      }),
    );

    try {
      const resp = await fetch(`${BACKEND_URL}/farm/agent/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ belief_grid: beliefGrid, robot_row: robot.row, robot_col: robot.col }),
      });

      if (!resp.ok) throw new Error(`Backend returned ${resp.status}`);

      const { next_row, next_col, action, reason } = await resp.json() as {
        next_row: number; next_col: number; action: string; reason: string;
      };

      const targetPlant = plantMap.get(`${next_row}-${next_col}`);
      if (!targetPlant) { set({ agentRunning: false }); return; }

      const { prediction, confidence } = mockClassifyPlantImage(targetPlant);
      const priorRisk = targetPlant.inspected ? targetPlant.beliefRisk : 0.3;
      const beliefRisk = calculateBeliefRisk({ prediction, confidence, priorRisk });
      const nextTick = tick + 1;

      const updatedPlants = plants.map((p) =>
        p.id === targetPlant.id
          ? { ...p, inspected: true, inspectedAtTick: nextTick, cvPrediction: prediction, cvConfidence: confidence, beliefLabel: prediction, beliefRisk, isCurrentTarget: true }
          : { ...p, isCurrentTarget: false },
      );
      const updatedRobots = robots.map((r) =>
        r.id === robot.id ? { ...r, row: next_row, col: next_col, status: "idle" as const } : r,
      );

      const confidencePct = Math.round(confidence * 100);
      const newLogs: AgentLogEntry[] = [
        { id: `step-${nextTick}`, tick: nextTick, message: `MDP → ${action} to (${next_row}, ${next_col}). ${reason}.` },
        { id: `cv-${nextTick}`, tick: nextTick, message: `CV: ${prediction.replaceAll("_", " ")} · ${confidencePct}% confidence · belief risk ${beliefRisk.toFixed(2)}.` },
      ];

      const allDone = updatedPlants.every((p) => p.inspected);
      set({
        tick: nextTick,
        plants: updatedPlants,
        robots: updatedRobots,
        metrics: calculateSimulationMetrics(updatedPlants),
        agentLogs: [
          ...current.agentLogs,
          ...newLogs,
          ...(allDone ? [{ id: `done-${nextTick}`, tick: nextTick, message: "All plants inspected. Requesting Fetch.ai farm analysis…" }] : []),
        ],
        selectedPlantId: targetPlant.id,
        lastInspectedPlantId: targetPlant.id,
        agentRunning: false,
        recommendation: allDone
          ? { title: "Fetch.ai agent analysing…", body: "Please wait while the agent reasons over the full farm scan." }
          : prediction === "healthy"
            ? { title: "No treatment needed", body: "Plant healthy. Continuing exploration.", nextAction: "Move to next unvisited cell." }
            : { title: "Disease detected", body: `${prediction.replaceAll("_", " ")} found. Belief risk: ${beliefRisk.toFixed(2)}.`, nextAction: "Inspect adjacent plants around the signal." },
      });

      if (allDone) {
        get().stopAutoRun();
        _requestAgentAnalysis(updatedPlants, rows, cols, nextTick);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({
        agentRunning: false,
        agentLogs: [
          ...get().agentLogs,
          { id: `error-${Date.now()}`, tick: get().tick, message: `Agent step failed: ${message}` },
        ],
      });
    }
  },

  startAutoRun: () => {
    if (_autoRunInterval) return;
    set({ isAutoRunning: true });
    _autoRunInterval = setInterval(() => {
      const state = useSimulationStore.getState();
      if (!state.agentRunning && !state.plants.every((p) => p.inspected)) {
        state.runAgentStep();
      } else if (state.plants.every((p) => p.inspected)) {
        useSimulationStore.getState().stopAutoRun();
      }
    }, 600);
  },

  stopAutoRun: () => {
    if (_autoRunInterval) {
      clearInterval(_autoRunInterval);
      _autoRunInterval = null;
    }
    set({ isAutoRunning: false });
  },

  analyzeWithAgent: async () => {
    const { plants, rows, cols } = get();
    const inspected = plants.filter((p) => p.inspected);
    if (inspected.length === 0) return;
    set({ agentRunning: true });
    await _requestAgentAnalysis(plants, rows, cols, get().tick);
    set({ agentRunning: false });
  },
}));

async function _requestAgentAnalysis(plants: Plant[], rows: number, cols: number, tick: number) {
  if (_analyzeInFlight) return;
  _analyzeInFlight = true;
  const plantMap = new Map(plants.map((p) => [`${p.row}-${p.col}`, p]));
  const beliefGrid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const plant = plantMap.get(`${r}-${c}`);
      return plant?.inspected ? plant.beliefRisk : null;
    }),
  );

  try {
    const resp = await fetch(`${BACKEND_URL}/farm/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ belief_grid: beliefGrid }),
    });
    if (!resp.ok) return;

    const data = await resp.json() as {
      reasoning: string;
      analysis: AgentAnalysis;
      agent_address?: string;
    };

    const analysis: AgentAnalysis = {
      ...data.analysis,
      reasoning: data.reasoning,
      agent_address: data.agent_address,
    };

    // Split reasoning into sentences for the log
    const sentences = (data.reasoning ?? "")
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    const thoughtEntries: AgentLogEntry[] = sentences.map((sentence, i) => ({
      id: `thought-${tick}-${i}`,
      tick,
      message: `__thought__ ${sentence}`,
    }));

    const { agentLogs } = useSimulationStore.getState();
    useSimulationStore.setState({
      agentAnalysis: analysis,
      agentLogs: [...agentLogs, ...thoughtEntries],
      recommendation: {
        title: "Fetch.ai Agent Analysis",
        body: analysis.overview ?? "",
        nextAction: analysis.recommendations ?? "",
      },
    });
  } catch {
    // silently ignore — analysis is best-effort
  } finally {
    _analyzeInFlight = false;
  }
}

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
  startAutoRun: () => useSimulationStore.getState().startAutoRun(),
  stopAutoRun: () => useSimulationStore.getState().stopAutoRun(),
  analyzeWithAgent: () => useSimulationStore.getState().analyzeWithAgent(),
};
