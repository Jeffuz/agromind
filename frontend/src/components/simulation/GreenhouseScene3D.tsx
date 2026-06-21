"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { FiArrowDown, FiArrowLeft, FiArrowRight, FiArrowUp, FiZoomIn, FiZoomOut } from "react-icons/fi";
import { Color, InstancedMesh, Object3D, OrthographicCamera, Vector3 } from "three";
import type { Plant, Robot } from "@/lib/types";

interface GreenhouseScene3DProps {
  plants: Plant[];
  robots?: Robot[];
  rows: number;
  cols: number;
  mode: "real" | "belief";
  showActualRiskOverlay?: boolean;
}

interface CameraControlApi {
  zoomIn: () => void;
  zoomOut: () => void;
  panLeft: () => void;
  panRight: () => void;
  panUp: () => void;
  panDown: () => void;
}

function CameraControls({ controlsRef }: { controlsRef: MutableRefObject<CameraControlApi | null> }) {
  const { camera, gl } = useThree();

  useEffect(() => {
    const orthographicCamera = camera as OrthographicCamera;
    const canvas = gl.domElement;
    const target = new Vector3(0, 0, 0);
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const setZoom = (zoom: number) => {
      orthographicCamera.zoom = Math.min(90, Math.max(25, zoom));
      orthographicCamera.updateProjectionMatrix();
    };
    const pan = (x: number, z: number) => {
      target.x += x;
      target.z += z;
      orthographicCamera.position.x += x;
      orthographicCamera.position.z += z;
      orthographicCamera.lookAt(target);
    };

    controlsRef.current = {
      zoomIn: () => setZoom(orthographicCamera.zoom + 8),
      zoomOut: () => setZoom(orthographicCamera.zoom - 8),
      panLeft: () => pan(-0.7, 0),
      panRight: () => pan(0.7, 0),
      panUp: () => pan(0, -0.7),
      panDown: () => pan(0, 0.7),
    };

    const handlePointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const scale = 1 / (orthographicCamera.zoom * 5);
      pan(-(event.clientX - lastX) * scale, -(event.clientY - lastY) * scale);
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const handlePointerUp = (event: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    return () => {
      controlsRef.current = null;
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [camera, controlsRef, gl]);

  return null;
}

function getGridPosition(row: number, col: number, rows: number, cols: number) {
  const rawX = col * 0.3 + Math.floor(col / 10) * 0.16;
  const rawZ = row * 0.46 + Math.floor(row / 5) * 0.22;
  const maxX = Math.max(0, (cols - 1) * 0.3 + Math.floor((cols - 1) / 10) * 0.16);
  const maxZ = Math.max(0, (rows - 1) * 0.46 + Math.floor((rows - 1) / 5) * 0.22);
  return [rawX - maxX / 2, rawZ - maxZ / 2] as const;
}

function getRiskColor(risk: number) {
  if (risk < 0.3) return "#78A86D";
  if (risk < 0.55) return "#D4B85E";
  if (risk < 0.78) return "#D98A4E";
  return "#C76650";
}

function GreenhouseBeds({ rows, cols, mode }: Pick<GreenhouseScene3DProps, "rows" | "cols" | "mode">) {
  const first = getGridPosition(0, 0, rows, cols);
  const last = getGridPosition(rows - 1, cols - 1, rows, cols);
  const width = Math.abs(last[0] - first[0]) + 0.42;

  return (
    <group>
      <mesh position={[0, -0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 1.2, Math.abs(last[1] - first[1]) + 1.2]} />
        <meshBasicMaterial color={mode === "real" ? "#8A7655" : "#DEE6E1"} />
      </mesh>
      {Array.from({ length: rows }, (_, row) => {
        const [, z] = getGridPosition(row, 0, rows, cols);
        return (
          <mesh key={row} position={[0, 0, z]}>
            <boxGeometry args={[width, 0.08, 0.27]} />
            <meshBasicMaterial color={mode === "real" ? "#8A7655" : "#CAD4CD"} />
          </mesh>
        );
      })}
    </group>
  );
}

function InstancedPlants({ plants, rows, cols, mode, showActualRiskOverlay = false }: Omit<GreenhouseScene3DProps, "robots">) {
  const stemsRef = useRef<InstancedMesh>(null);
  const leavesARef = useRef<InstancedMesh>(null);
  const leavesBRef = useRef<InstancedMesh>(null);
  const shadowsRef = useRef<InstancedMesh>(null);
  const overlaysRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const stems = stemsRef.current;
    const leavesA = leavesARef.current;
    const leavesB = leavesBRef.current;
    const shadows = shadowsRef.current;
    const overlays = overlaysRef.current;
    if (!stems || !leavesA || !leavesB || !shadows || !overlays) return;

    plants.forEach((plant, index) => {
      const [x, z] = getGridPosition(plant.row, plant.col, rows, cols);
      const rotation = ((plant.row * 137 + plant.col * 79) % 360) * (Math.PI / 180);
      const scale = 0.86 + ((plant.row * 3 + plant.col * 7) % 5) * 0.035;
      const offsetX = Math.cos(rotation) * 0.038;
      const offsetZ = Math.sin(rotation) * 0.038;
      const unknown = mode === "belief" && (!plant.inspected || plant.beliefLabel === "unknown");
      const leafColor = unknown
        ? new Color("#9DA9A0")
        : new Color((plant.row + plant.col) % 3 === 0 ? "#2F8F43" : "#4DA852");

      dummy.position.set(x, 0.17, z);
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      stems.setMatrixAt(index, dummy.matrix);
      stems.setColorAt(index, unknown ? new Color("#87938B") : new Color("#286F36"));

      dummy.position.set(x - offsetX, 0.255, z - offsetZ);
      dummy.rotation.set(0.15, rotation - 0.65, -0.25);
      dummy.scale.set(0.085 * scale, 0.03 * scale, 0.17 * scale);
      dummy.updateMatrix();
      leavesA.setMatrixAt(index, dummy.matrix);
      leavesA.setColorAt(index, leafColor);

      dummy.position.set(x + offsetX, 0.26, z + offsetZ);
      dummy.rotation.set(-0.1, rotation + 0.7, 0.28);
      dummy.scale.set(0.085 * scale, 0.03 * scale, 0.17 * scale);
      dummy.updateMatrix();
      leavesB.setMatrixAt(index, dummy.matrix);
      leavesB.setColorAt(index, leafColor.clone().offsetHSL(0.01, 0, 0.06));

      dummy.position.set(x + 0.025, 0.052, z + 0.025);
      dummy.rotation.set(-Math.PI / 2, 0, rotation);
      dummy.scale.set(0.8 * scale, 0.58 * scale, 1);
      dummy.updateMatrix();
      shadows.setMatrixAt(index, dummy.matrix);

      const showOverlay = mode === "real"
        ? showActualRiskOverlay
        : plant.inspected && plant.beliefLabel !== "unknown";
      const risk = mode === "real" ? plant.actualRisk : plant.beliefRisk;
      dummy.position.set(x, 0.055, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.setScalar(showOverlay ? 1 : 0);
      dummy.updateMatrix();
      overlays.setMatrixAt(index, dummy.matrix);
      overlays.setColorAt(index, new Color(getRiskColor(risk)));
    });

    [stems, leavesA, leavesB, shadows, overlays].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [cols, dummy, mode, plants, rows, showActualRiskOverlay]);

  const targets = plants.filter((plant) => plant.isCurrentTarget);

  return (
    <group>
      <instancedMesh ref={shadowsRef} args={[undefined, undefined, plants.length]}>
        <circleGeometry args={[0.13, 10]} />
        <meshBasicMaterial color="#2F271D" transparent opacity={0.2} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={overlaysRef} args={[undefined, undefined, plants.length]}>
        <circleGeometry args={[0.15, 12]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.42} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={stemsRef} args={[undefined, undefined, plants.length]}>
        <cylinderGeometry args={[0.022, 0.03, 0.25, 5]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={leavesARef} args={[undefined, undefined, plants.length]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={leavesBRef} args={[undefined, undefined, plants.length]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </instancedMesh>
      {targets.map((plant) => {
        const [x, z] = getGridPosition(plant.row, plant.col, rows, cols);
        return (
          <mesh key={plant.id} position={[x, 0.075, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.022, 6, 18]} />
            <meshBasicMaterial color="#D97706" />
          </mesh>
        );
      })}
    </group>
  );
}

function Rover({ robot, rows, cols }: { robot: Robot; rows: number; cols: number }) {
  const [x, z] = getGridPosition(robot.row, robot.col, rows, cols);
  return (
    <group position={[x, 0.18, z + 0.22]} scale={0.7}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.19, 0.09, 12]} />
        <meshStandardMaterial color="#3F5147" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.08, 12]} />
        <meshStandardMaterial color="#819486" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.125, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.105, 0.012, 6, 16]} />
        <meshStandardMaterial color="#D7DED8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.048, 10, 7]} />
        <meshStandardMaterial color="#D1A64A" roughness={0.42} />
      </mesh>
      {[
        [0.19, 0],
        [-0.19, 0],
        [0, 0.19],
        [0, -0.19],
      ].map(([offsetX, offsetZ]) => (
        <mesh key={`${offsetX}-${offsetZ}`} position={[offsetX, -0.01, offsetZ]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshStandardMaterial color="#303934" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ plants, robots = [], rows, cols, mode, showActualRiskOverlay, controlsRef }: GreenhouseScene3DProps & { controlsRef: MutableRefObject<CameraControlApi | null> }) {
  return (
    <>
      <color attach="background" args={[mode === "real" ? "#8A7655" : "#EEF3F0"]} />
      <CameraControls controlsRef={controlsRef} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[6, 10, 8]} intensity={1.55} color="#FFFDF4" />
      <directionalLight position={[-5, 5, -4]} intensity={0.45} color="#D9E8DD" />
      <GreenhouseBeds rows={rows} cols={cols} mode={mode} />
      <InstancedPlants plants={plants} rows={rows} cols={cols} mode={mode} showActualRiskOverlay={showActualRiskOverlay} />
      {mode === "real" && robots.map((robot) => <Rover key={robot.id} robot={robot} rows={rows} cols={cols} />)}
    </>
  );
}

export function GreenhouseScene3D(props: GreenhouseScene3DProps) {
  const controlsRef = useRef<CameraControlApi | null>(null);

  return (
    <div className="relative h-full w-full">
      <Canvas
        orthographic
        camera={{ position: [0, 18, 17], zoom: 46, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ camera }) => {
          camera.up.set(0, 0, -1);
          camera.lookAt(0, 0, 0);
        }}
        style={{
          background: props.mode === "real" ? "#8A7655" : "#EEF3F0",
          cursor: "grab",
          touchAction: "none",
        }}
      >
        <Scene {...props} controlsRef={controlsRef} />
      </Canvas>

      <div className="absolute left-2 top-2 flex gap-1 rounded-lg border border-[#D6D9CC] bg-white/90 p-1 shadow-sm">
        <button type="button" aria-label="Zoom in" onClick={() => controlsRef.current?.zoomIn()} className="rounded p-1.5 text-[#42534A] hover:bg-[#EAF5EA]">
          <FiZoomIn />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => controlsRef.current?.zoomOut()} className="rounded p-1.5 text-[#42534A] hover:bg-[#EAF5EA]">
          <FiZoomOut />
        </button>
        {/* <span className="mx-0.5 w-px bg-[#DDE5D8]" />
        <button type="button" aria-label="Move left" onClick={() => controlsRef.current?.panLeft()} className="rounded p-1.5 text-[#42534A] hover:bg-[#EAF5EA]">
          <FiArrowLeft />
        </button>
        <button type="button" aria-label="Move up" onClick={() => controlsRef.current?.panUp()} className="rounded p-1.5 text-[#42534A] hover:bg-[#EAF5EA]">
          <FiArrowUp />
        </button>
        <button type="button" aria-label="Move down" onClick={() => controlsRef.current?.panDown()} className="rounded p-1.5 text-[#42534A] hover:bg-[#EAF5EA]">
          <FiArrowDown />
        </button>
        <button type="button" aria-label="Move right" onClick={() => controlsRef.current?.panRight()} className="rounded p-1.5 text-[#42534A] hover:bg-[#EAF5EA]">
          <FiArrowRight />
        </button> */}
      </div>
    </div>
  );
}
