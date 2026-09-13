import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { Pointer } from "./use-scene";

const TEAL = "#1fb6c9";
const GREEN = "#6cc04a";

/** Evenly spread points on a sphere (Fibonacci lattice). */
function useLatticeNodes(count: number, radius: number) {
  return useMemo(() => {
    const golden = Math.PI * (1 + Math.sqrt(5));
    const out: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = golden * i;
      out.push([
        Math.cos(theta) * Math.sin(phi) * radius,
        Math.sin(theta) * Math.sin(phi) * radius,
        Math.cos(phi) * radius,
      ]);
    }
    return out;
  }, [count, radius]);
}

function Network({ pointer }: { pointer: RefObject<Pointer> }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const nodes = useLatticeNodes(42, 1.6);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const p = pointer.current;
    const g = group.current;
    if (g) {
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, t * 0.12 + p.x * 0.45, 4, dt);
      g.rotation.x = THREE.MathUtils.damp(
        g.rotation.x,
        Math.sin(t * 0.3) * 0.15 - p.y * 0.3,
        4,
        dt,
      );
    }
    const s = shell.current;
    if (s) s.rotation.y = -t * 0.05;
  });

  return (
    <group ref={group}>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.6, 2]} />
        <meshBasicMaterial color={TEAL} wireframe transparent opacity={0.26} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.02, 48, 48]} />
        <meshPhysicalMaterial
          color="#0d2431"
          roughness={0.35}
          metalness={0.4}
          clearcoat={1}
          emissive="#0a4b57"
          emissiveIntensity={0.9}
        />
      </mesh>
      {nodes.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={i % 4 === 0 ? GREEN : TEAL} />
        </mesh>
      ))}
    </group>
  );
}

type OrbSceneProps = { active: boolean; pointer: RefObject<Pointer> };

/** A small "network orb" used as an ambient accent on inner pages. */
export default function OrbScene({ active, pointer }: OrbSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "default" }}
      camera={{ position: [0, 0, 5], fov: 40 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
    >
      <AdaptiveDpr pixelated />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <pointLight position={[-4, -2, 3]} intensity={25} color={TEAL} distance={12} />
      <Network pointer={pointer} />
      <Sparkles count={60} scale={[6, 6, 4]} size={2} speed={0.25} opacity={0.5} color="#8fdcea" />
    </Canvas>
  );
}
