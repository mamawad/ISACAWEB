import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatTileProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string | undefined;
  tone?: "violet" | "lime" | "coral" | "sky";
  className?: string | undefined;
};

const TONES = {
  violet: "from-violet-500/15 to-violet-500/0 text-violet-700",
  lime: "from-lime-500/20 to-lime-500/0 text-lime-800",
  coral: "from-orange-500/15 to-orange-500/0 text-orange-700",
  sky: "from-sky-500/15 to-sky-500/0 text-sky-700",
} as const;

/** Count-up number in a card. */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  tone = "violet",
  className,
}: StatTileProps) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce) {
      if (ref.current) ref.current.textContent = String(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(Math.round(v));
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, mv, reduce]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("card-glow relative overflow-hidden p-5", className)}
    >
      <div className={cn("absolute inset-0 bg-linear-to-br", TONES[tone])} aria-hidden="true" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight">
            <span ref={ref}>{reduce ? value : 0}</span>
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl bg-white/70 shadow-sm",
            TONES[tone].split(" ").pop(),
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.div>
  );
}
