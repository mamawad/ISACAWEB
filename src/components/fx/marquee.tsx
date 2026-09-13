import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MarqueeProps = {
  children: ReactNode;
  className?: string | undefined;
  reverse?: boolean;
  /** Seconds for one full loop. */
  duration?: number;
};

/** Seamless horizontal loop. Children are rendered twice; the copy is aria-hidden. */
export function Marquee({ children, className, reverse = false, duration = 45 }: MarqueeProps) {
  return (
    <div className={cn("marquee", className)}>
      <div
        className="marquee-track"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className="marquee-group">{children}</div>
        <div className="marquee-group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
