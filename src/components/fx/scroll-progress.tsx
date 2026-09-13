import { motion, useScroll, useSpring } from "motion/react";

/** Thin brand-gradient bar across the very top that tracks page scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.3,
  });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-linear-to-r from-brand-teal via-brand-green to-brand-blue"
      style={{ scaleX }}
    />
  );
}
