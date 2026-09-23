import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCanRender3D, useInViewport, usePointerRef, useScrollRef } from "./use-scene";

// Lazy so three.js never enters the SSR bundle or the initial client chunk.
const HeroScene = lazy(() => import("./hero-scene"));

function StaticLogo({ hidden }: { hidden: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center transition-opacity duration-700 md:justify-end md:pr-[9%]",
        hidden ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="relative animate-float-slow">
        <div
          className="absolute -inset-16 rounded-full bg-brand-teal/20 blur-3xl"
          aria-hidden="true"
        />
        <img
          src="/brand/isaca-square.png"
          alt=""
          className="relative h-44 w-44 rounded-3xl opacity-90 shadow-2xl shadow-brand-teal/20 sm:h-60 sm:w-60"
        />
      </div>
    </div>
  );
}

/**
 * Full-bleed 3D backdrop for the homepage hero. Falls back to a floating
 * logo when WebGL is unavailable or the user prefers reduced motion, and
 * pauses its render loop whenever it scrolls out of view.
 */
export function Hero3D({
  className,
  festive = false,
}: {
  className?: string | undefined;
  festive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const support = useCanRender3D();
  const visible = useInViewport(ref);
  const pointer = usePointerRef(ref);
  const scroll = useScrollRef();
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <div ref={ref} aria-hidden="true" className={cn("absolute inset-0 overflow-hidden", className)}>
      <StaticLogo hidden={ready} />
      {support === "yes" ? (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <Suspense fallback={null}>
            <HeroScene
              active={visible}
              pointer={pointer}
              scroll={scroll}
              onReady={onReady}
              festive={festive}
            />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
