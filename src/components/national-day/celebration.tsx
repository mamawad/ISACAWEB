import { useCallback, useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};

const COLORS = ["#00a651", "#2fd27a", "#ffffff", "#e8c872", "#0b8a4a"];

/**
 * Green, white and gold fireworks over its parent. Bursts a few times on
 * mount (once per browser session) and again on click. Draws nothing for
 * reduced-motion users. The canvas never blocks pointer events.
 */
export function Celebration({ className }: { className?: string | undefined }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number | null>(null);
  const reduced = useRef(false);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";
    const next: Particle[] = [];
    for (const p of particles.current) {
      p.life += 1;
      if (p.life > p.max) continue;
      p.vy += 0.035;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, p.size * dpr * (0.6 + a * 0.4), 0, Math.PI * 2);
      ctx.fill();
      next.push(p);
    }
    particles.current = next;
    raf.current = next.length ? requestAnimationFrame(loop) : null;
  }, []);

  const burst = useCallback(
    (x: number, y: number, count = 90) => {
      if (reduced.current) return;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = 1.6 + Math.random() * 3.2;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 60 + Math.random() * 50,
          color: COLORS[i % COLORS.length]!,
          size: 1.3 + Math.random() * 1.8,
        });
      }
      if (raf.current === null) raf.current = requestAnimationFrame(loop);
    },
    [loop],
  );

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const timers: number[] = [];
    let played = false;
    try {
      played = sessionStorage.getItem("nd-fireworks") === "1";
      sessionStorage.setItem("nd-fireworks", "1");
    } catch {
      /* storage blocked — just play */
    }
    if (!played) {
      const r = canvas.getBoundingClientRect();
      const spots = [
        [0.72, 0.28, 400],
        [0.52, 0.18, 900],
        [0.86, 0.42, 1350],
        [0.62, 0.36, 1900],
      ] as const;
      for (const [fx, fy, delay] of spots) {
        timers.push(window.setTimeout(() => burst(r.width * fx, r.height * fy), delay));
      }
    }

    return () => {
      window.removeEventListener("resize", resize);
      timers.forEach((t) => window.clearTimeout(t));
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [burst]);

  // Clicks anywhere on the parent section (outside links/buttons) fire a burst.
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button,input,select,textarea")) return;
      const r = canvas.getBoundingClientRect();
      burst(e.clientX - r.left, e.clientY - r.top, 70);
    };
    host.addEventListener("click", onClick);
    return () => host.removeEventListener("click", onClick);
  }, [burst]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? "pointer-events-none absolute inset-0 z-[5] h-full w-full"}
    />
  );
}
