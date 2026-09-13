import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Maximum tilt in degrees on each axis. */
  max?: number;
  /** Show a light glare that follows the cursor. */
  glare?: boolean;
};

/**
 * A card that tilts toward the cursor in 3D. Pure CSS transforms driven by
 * custom properties, so it costs nothing when idle and disables itself on
 * touch devices and for reduced-motion users (see .tilt in styles.css).
 */
export function TiltCard({ children, className, style, max = 9, glare = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--glare", "1");
    el.classList.remove("is-resting");
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare", "0");
    el.classList.add("is-resting");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("tilt is-resting", className)}
      style={style}
    >
      {children}
      {glare ? <span aria-hidden="true" className="tilt-glare" /> : null}
    </div>
  );
}
