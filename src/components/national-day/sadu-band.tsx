import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * A strip of Sadu-weave geometry — the stepped triangles and diamonds of
 * Bedouin tent weaving — in national green, white and gold. Tiles
 * horizontally at any width; the pattern drifts slowly unless reduced motion.
 */
export function SaduBand({
  className,
  height = 22,
  animated = true,
}: {
  className?: string | undefined;
  height?: number;
  animated?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const w = height * 2;
  const h = height;
  return (
    <div
      aria-hidden="true"
      className={cn("sadu-band relative w-full overflow-hidden", className)}
      style={{ height: h }}
    >
      <svg
        width="100%"
        height={h}
        className={cn("absolute inset-y-0 left-0", animated && "sadu-drift")}
        style={{ width: `calc(100% + ${w}px)`, ["--sadu-tile" as string]: `${w}px` }}
      >
        <defs>
          <pattern id={`sadu-${id}`} width={w} height={h} patternUnits="userSpaceOnUse">
            <rect width={w} height={h} fill="var(--ksa-green-deep)" />
            {/* Stepped triangles, top and bottom */}
            <path
              d={`M0 0 L${w / 4} ${h * 0.42} L${w / 2} 0 Z M${w / 2} 0 L${(w * 3) / 4} ${h * 0.42} L${w} 0 Z`}
              fill="var(--ksa-green)"
            />
            <path
              d={`M0 ${h} L${w / 4} ${h * 0.58} L${w / 2} ${h} Z M${w / 2} ${h} L${(w * 3) / 4} ${h * 0.58} L${w} ${h} Z`}
              fill="var(--ksa-green)"
            />
            {/* Central diamonds */}
            <path
              d={`M${w / 4} ${h * 0.22} L${w / 4 + h * 0.28} ${h / 2} L${w / 4} ${h * 0.78} L${w / 4 - h * 0.28} ${h / 2} Z`}
              fill="var(--ksa-white)"
            />
            <path
              d={`M${(w * 3) / 4} ${h * 0.32} L${(w * 3) / 4 + h * 0.18} ${h / 2} L${(w * 3) / 4} ${h * 0.68} L${(w * 3) / 4 - h * 0.18} ${h / 2} Z`}
              fill="var(--ksa-gold)"
            />
            {/* Stitch dots */}
            <circle cx={0} cy={h / 2} r={h * 0.07} fill="var(--ksa-gold)" />
            <circle cx={w / 2} cy={h / 2} r={h * 0.07} fill="var(--ksa-white)" />
            <circle cx={w} cy={h / 2} r={h * 0.07} fill="var(--ksa-gold)" />
          </pattern>
        </defs>
        <rect width="100%" height={h} fill={`url(#sadu-${id})`} />
      </svg>
    </div>
  );
}
