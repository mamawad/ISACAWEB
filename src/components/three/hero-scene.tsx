import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { Pointer } from "./use-scene";

const TEAL = "#1fb6c9";
const GREEN = "#6cc04a";
const BLUE = "#2a8fd6";

/**
 * The ISACA mark: a 3×3 grid of open rings running from light blue (top-left)
 * through teal to green (top-right) and down to navy (bottom-left). Colours
 * sampled from the official lockup; order is row-major.
 */
const MARK_COLORS = [
  "#29a8e0",
  "#2bb3a9",
  "#78be43",
  "#1f6fb5",
  "#29a8e0",
  "#3cb59a",
  "#1c3f6e",
  "#1f6fb5",
  "#29a8e0",
];

const RING_RADIUS = 0.42;
const RING_TUBE = 0.105;
const RING_ARC = Math.PI * 1.62; // ~290°, leaving the gap the logo has
const RING_GAP_ANGLE = (3 * Math.PI) / 4; // gap centred at upper-left
const CELL = 1.08;

type RingSpec = {
  index: number;
  color: string;
  target: THREE.Vector3;
  start: THREE.Vector3;
  phase: number;
};

function useRingSpecs(): RingSpec[] {
  return useMemo(() => {
    const specs: RingSpec[] = [];
    for (let i = 0; i < 9; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const target = new THREE.Vector3((col - 1) * CELL, (1 - row) * CELL, 0);
      // Deterministic "scattered" start so the assembly reads the same every load.
      const a = i * 2.399; // golden angle, in radians
      const start = new THREE.Vector3(
        Math.cos(a) * 3.2 + target.x * 1.6,
        Math.sin(a) * 2.4 + target.y * 1.6,
        -2.5 - (i % 4) * 0.9,
      );
      specs.push({
        index: i,
        color: MARK_COLORS[i] ?? TEAL,
        target,
        start,
        phase: i * 0.7,
      });
    }
    return specs;
  }, []);
}

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

type SceneProps = {
  pointer: RefObject<Pointer>;
  scroll: RefObject<number>;
  onReady?: (() => void) | undefined;
};

function Ring({ spec, scroll }: { spec: RingSpec; scroll: RefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const s = scroll.current;

    // Assembly: rings fly in one after another over the first ~1.6s.
    const p = easeOut(THREE.MathUtils.clamp((t - 0.15 - spec.index * 0.07) * 1.1, 0, 1));
    tmp.lerpVectors(spec.start, spec.target, p);

    // Idle drift + a gentle spread as the page scrolls.
    const drift = Math.sin(t * 0.9 + spec.phase) * 0.06;
    const spread = 1 + s * 0.35;
    g.position.set(
      tmp.x * spread,
      tmp.y * spread + drift,
      tmp.z + Math.sin(t * 0.7 + spec.phase) * 0.08,
    );
    g.rotation.z = RING_GAP_ANGLE + Math.sin(t * 0.5 + spec.phase) * 0.06;
    g.rotation.x = Math.sin(t * 0.6 + spec.phase) * 0.12;
    g.rotation.y = Math.cos(t * 0.45 + spec.phase) * 0.12;
    const sc = 0.6 + 0.4 * p;
    g.scale.setScalar(sc);
  });

  return (
    <group ref={ref} position={spec.start}>
      <mesh>
        <torusGeometry args={[RING_RADIUS, RING_TUBE, 24, 72, RING_ARC]} />
        <meshPhysicalMaterial
          color={spec.color}
          metalness={0.3}
          roughness={0.24}
          clearcoat={1}
          clearcoatRoughness={0.15}
          emissive={spec.color}
          emissiveIntensity={0.22}
        />
      </mesh>
    </group>
  );
}

const ORBIT_NODES = [0, 1, 2].map((i) => (i / 3) * Math.PI * 2);

function Centerpiece({ pointer, scroll, onReady }: SceneProps) {
  const specs = useRingSpecs();
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const orbit2 = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const viewport = useThree((s) => s.viewport);
  const wide = viewport.width > 7.5;

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = pointer.current;
    const s = scroll.current;
    const t = state.clock.elapsedTime;

    const o = outer.current;
    if (o) {
      // Desktop: mark sits to the right of the copy. Phones: below it.
      const targetX = wide ? 1.55 : 0;
      const targetY = (wide ? 0 : -1.25) - s * 1.6;
      o.position.x = THREE.MathUtils.damp(o.position.x, targetX, 3, dt);
      o.position.y = THREE.MathUtils.damp(o.position.y, targetY, 3, dt);
      const sc = (wide ? 1 : 0.62) * (1 - s * 0.3);
      o.scale.setScalar(THREE.MathUtils.damp(o.scale.x, sc, 3, dt));
    }
    const i = inner.current;
    if (i) {
      i.rotation.y = THREE.MathUtils.damp(i.rotation.y, p.x * 0.55 + s * 1.4, 3.5, dt);
      i.rotation.x = THREE.MathUtils.damp(i.rotation.x, -p.y * 0.4 + s * 0.35, 3.5, dt);
    }
    const r = orbit.current;
    if (r) r.rotation.z = t * 0.22;
    const r2 = orbit2.current;
    if (r2) r2.rotation.z = -t * 0.12;
    const h = halo.current;
    if (h) {
      h.rotation.y = t * 0.06 + p.x * 0.2;
      h.rotation.x = t * 0.025 - p.y * 0.15;
    }
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        {specs.map((spec) => (
          <Ring key={spec.index} spec={spec} scroll={scroll} />
        ))}
      </group>

      {/* Orbit ring with three travelling nodes */}
      <group ref={orbit} rotation={[Math.PI / 2.2, 0, 0]}>
        <mesh>
          <torusGeometry args={[2.45, 0.012, 12, 220]} />
          <meshBasicMaterial color={TEAL} transparent opacity={0.35} />
        </mesh>
        {ORBIT_NODES.map((a, idx) => (
          <mesh key={idx} position={[Math.cos(a) * 2.45, Math.sin(a) * 2.45, 0]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshBasicMaterial color={idx === 1 ? GREEN : TEAL} />
          </mesh>
        ))}
      </group>

      {/* Second, wider ring on a different axis */}
      <mesh ref={orbit2} rotation={[Math.PI / 2.6, 0.5, 0.4]}>
        <torusGeometry args={[2.95, 0.008, 12, 220]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.22} />
      </mesh>

      {/* Faint wireframe halo far behind */}
      <mesh ref={halo} scale={3.7} position={[0, 0, -1.6]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={BLUE} wireframe transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

type HeroSceneProps = SceneProps & { active: boolean };

/**
 * The homepage hero scene. Mounted client-only via lazy import; the wrapper
 * (Hero3D) owns pointer/scroll tracking and the static fallback.
 */
export default function HeroScene({ active, pointer, scroll, onReady }: HeroSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 7], fov: 36 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <AdaptiveDpr pixelated />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} />
      <pointLight position={[-5, -2, 4]} intensity={35} color={TEAL} distance={16} />
      <pointLight position={[5, 3, -4]} intensity={30} color={GREEN} distance={16} />
      <spotLight position={[0, 6, 3]} angle={0.6} penumbra={1} intensity={60} color="#bfefff" />
      <Centerpiece pointer={pointer} scroll={scroll} onReady={onReady} />
      <Sparkles
        count={140}
        scale={[11, 7, 5]}
        size={2.4}
        speed={0.3}
        opacity={0.55}
        color="#8fdcea"
        noise={0.6}
      />
    </Canvas>
  );
}
