import { cn } from "@/lib/utils";

/** Stylised date palm, line-drawn so it sits on any ground. */
export function Palm({ className }: { className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      aria-hidden="true"
      className={cn("text-[var(--ksa-green-bright)]", className)}
    >
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Trunk with ring segments */}
        <path d="M60 58 C58 90 57 120 62 156" />
        {[70, 82, 94, 106, 118, 130, 142].map((y) => (
          <path key={y} d={`M${55 + (y - 58) * 0.02} ${y} q5 3 10 0`} opacity="0.7" />
        ))}
        {/* Fronds */}
        <path d="M60 58 C44 44 26 44 8 56" />
        <path d="M60 58 C48 36 32 26 14 26" />
        <path d="M60 58 C58 36 50 18 36 6" />
        <path d="M60 58 C62 36 70 18 84 6" />
        <path d="M60 58 C72 36 88 26 106 26" />
        <path d="M60 58 C76 44 94 44 112 56" />
        {/* Leaflets */}
        {[
          [30, 48, 26, 56],
          [20, 50, 16, 58],
          [36, 34, 30, 40],
          [24, 30, 18, 34],
          [48, 22, 42, 26],
          [44, 14, 38, 16],
          [90, 48, 94, 56],
          [100, 50, 104, 58],
          [84, 34, 90, 40],
          [96, 30, 102, 34],
          [72, 22, 78, 26],
          [76, 14, 82, 16],
        ].map(([x1, y1, x2, y2], i) => (
          <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} opacity="0.75" />
        ))}
        {/* Dates */}
        <circle cx="54" cy="66" r="2.4" fill="var(--ksa-gold)" stroke="none" />
        <circle cx="60" cy="68" r="2.4" fill="var(--ksa-gold)" stroke="none" />
        <circle cx="66" cy="66" r="2.4" fill="var(--ksa-gold)" stroke="none" />
      </g>
    </svg>
  );
}
