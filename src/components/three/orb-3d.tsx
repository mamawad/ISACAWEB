import { lazy, Suspense, useRef } from "react";
import { cn } from "@/lib/utils";
import { useCanRender3D, useInViewport, usePointerRef } from "./use-scene";

const OrbScene = lazy(() => import("./orb-scene"));

function StaticOrb() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-[62%] w-[62%] animate-float-slow">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,oklch(0.42_0.1_200),oklch(0.16_0.04_258)_70%)] shadow-[0_0_80px_-10px_var(--brand-teal)]" />
        <div className="absolute -inset-[12%] rounded-full border border-brand-teal/30" />
        <div className="absolute -inset-[24%] rounded-full border border-brand-green/15" />
      </div>
    </div>
  );
}

/**
 * Ambient network-orb accent. Sizes to its parent, so wrap it in a box with an
 * aspect ratio. Same fallback rules as Hero3D.
 */
export function Orb3D({ className }: { className?: string | undefined }) {
  const ref = useRef<HTMLDivElement>(null);
  const support = useCanRender3D();
  const visible = useInViewport(ref);
  const pointer = usePointerRef(ref);

  return (
    <div ref={ref} aria-hidden="true" className={cn("absolute inset-0 overflow-hidden", className)}>
      {support === "yes" ? (
        <div className="absolute inset-0 animate-in fade-in duration-1000">
          <Suspense fallback={<StaticOrb />}>
            <OrbScene active={visible} pointer={pointer} />
          </Suspense>
        </div>
      ) : (
        <StaticOrb />
      )}
    </div>
  );
}
