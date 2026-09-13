import { useEffect, useRef, useState, type RefObject } from "react";

export type Support = "pending" | "yes" | "no";

/**
 * Whether a WebGL scene should be mounted. "pending" during SSR and the first
 * client paint so the static fallback renders identically on both sides.
 * Honours prefers-reduced-motion: those users get the still composition.
 */
export function useCanRender3D(): Support {
  const [support, setSupport] = useState<Support>("pending");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSupport("no");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      setSupport(gl ? "yes" : "no");
    } catch {
      setSupport("no");
    }
  }, []);
  return support;
}

/** True while `ref` is near the viewport — used to pause the render loop off-screen. */
export function useInViewport<T extends Element>(
  ref: RefObject<T | null>,
  rootMargin = "160px",
): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return visible;
}

export type Pointer = { x: number; y: number };

/**
 * Pointer position normalised to -1..1 relative to `ref`, tracked on window so
 * text overlaid on the canvas does not swallow the events. Read it inside
 * useFrame; it never triggers a React render.
 */
export function usePointerRef<T extends HTMLElement>(ref: RefObject<T | null>): RefObject<Pointer> {
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      pointer.current.x = Math.max(-1.6, Math.min(1.6, x));
      pointer.current.y = Math.max(-1.6, Math.min(1.6, y));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [ref]);
  return pointer;
}

/** Scroll progress 0..1 across roughly the first viewport, for scroll-linked motion. */
export function useScrollRef(viewportFraction = 0.9): RefObject<number> {
  const progress = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const max = window.innerHeight * viewportFraction;
      progress.current = Math.min(1, Math.max(0, window.scrollY / max));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [viewportFraction]);
  return progress;
}
