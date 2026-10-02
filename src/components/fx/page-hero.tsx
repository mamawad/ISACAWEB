import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: ReactNode;
  lead?: ReactNode;
  /** Visual for the right-hand column; stacks under the copy on small screens. */
  aside?: ReactNode;
  children?: ReactNode;
  className?: string | undefined;
};

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Shared inner-page header: aurora backdrop, grid, and a settling title. */
export function PageHero({ title, lead, aside, children, className }: PageHeroProps) {
  const reduce = useReducedMotion();
  const settle = (delay: number) => ({
    initial: reduce ? false : { y: 18 },
    animate: { y: 0 },
    transition: { duration: 1, delay, ease: EASE },
  });

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-white/5 pt-32 pb-16 sm:pt-36 sm:pb-20 md:pt-40 md:pb-24",
        className,
      )}
    >
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div
        className={cn(
          "relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6",
          aside && "lg:grid-cols-[1.1fr_0.9fr] lg:gap-14",
        )}
      >
        <div>
          <motion.h1
            className={cn(
              "max-w-3xl font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance text-foreground sm:text-6xl md:text-[4.25rem]",
              aside && "lg:text-[3.5rem] xl:text-[3.9rem]",
            )}
            {...settle(0)}
          >
            {title}
          </motion.h1>
          {lead ? (
            <motion.p
              className="mt-6 max-w-[38rem] text-lg leading-relaxed text-pretty text-muted-foreground sm:text-xl"
              {...settle(0.06)}
            >
              {lead}
            </motion.p>
          ) : null}
          {children ? (
            <motion.div className="mt-8" {...settle(0.12)}>
              {children}
            </motion.div>
          ) : null}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
      </div>
    </section>
  );
}
