import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** Event photography under public/photos/opening, exported at 800 and 1600 wide. */
export type OpeningPhoto = "stage" | "audience" | "theory" | "riyadh";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type PhotoProps = {
  name: OpeningPhoto;
  alt: string;
  /** Sizes hint for the browser, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes?: string | undefined;
  className?: string | undefined;
  /** Class for the <img>, e.g. an object-position. */
  imgClassName?: string | undefined;
  priority?: boolean;
};

/**
 * A photo in a rounded frame that opens from a slightly inset clip as it
 * scrolls into view. The frame is visible from the first paint, so the
 * reveal never hides content.
 */
export function Photo({
  name,
  alt,
  sizes = "100vw",
  className,
  imgClassName,
  priority,
}: PhotoProps) {
  const reduce = useReducedMotion();
  return (
    <motion.figure
      className={cn("photo-frame relative overflow-hidden", className)}
      initial={reduce ? false : { clipPath: "inset(5% 5% 5% 5% round 28px)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 28px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1.1, ease: EASE }}
    >
      <motion.img
        src={`/photos/opening/${name}-1600.webp`}
        srcSet={`/photos/opening/${name}-800.webp 800w, /photos/opening/${name}-1600.webp 1600w`}
        sizes={sizes}
        alt={alt}
        width={1600}
        height={1067}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("h-full w-full object-cover", imgClassName)}
        initial={reduce ? false : { scale: 1.06 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1.4, ease: EASE }}
      />
    </motion.figure>
  );
}
