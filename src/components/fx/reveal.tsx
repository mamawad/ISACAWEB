import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type RevealProps = {
  children: ReactNode;
  className?: string | undefined;
  delay?: number;
  y?: number;
  once?: boolean;
};

/**
 * Settles its children into place the first time they scroll into view.
 * Content is fully visible from the first paint; only the position eases,
 * so nothing is hidden from readers, crawlers or full-page captures.
 */
export function Reveal({ children, className, delay = 0, y = 16, once = true }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { y }}
      whileInView={{ y: 0 }}
      viewport={{ once, amount: 0.15 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.8, ease: EASE } },
};

type StaggerProps = {
  children: ReactNode;
  className?: string | undefined;
  once?: boolean;
};

/** Wrap a list of <StaggerItem>s to settle them one after another. */
export function Stagger({ children, className, once = true }: StaggerProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={container}
      initial={reduce ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
