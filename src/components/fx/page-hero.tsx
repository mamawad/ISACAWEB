import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Optional visual for the right-hand column (e.g. an Orb3D). */
  aside?: ReactNode;
  children?: ReactNode;
  className?: string | undefined;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Shared inner-page header: aurora backdrop, grid, staggered title reveal. */
export function PageHero({ eyebrow, title, lead, aside, children, className }: PageHeroProps) {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE },
  });

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-white/5 pt-36 pb-16 sm:pt-40 sm:pb-20 md:pt-44 md:pb-24",
        className,
      )}
    >
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="grid-lines absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <motion.p className="eyebrow" {...rise(0)}>
            {eyebrow}
          </motion.p>
          <motion.h1
            className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl"
            {...rise(0.08)}
          >
            {title}
          </motion.h1>
          {lead ? (
            <motion.p
              className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground sm:text-xl"
              {...rise(0.16)}
            >
              {lead}
            </motion.p>
          ) : null}
          {children ? (
            <motion.div className="mt-8" {...rise(0.24)}>
              {children}
            </motion.div>
          ) : null}
        </div>
        {aside ? (
          <motion.div
            className="relative hidden md:block"
            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: EASE }}
          >
            {aside}
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
