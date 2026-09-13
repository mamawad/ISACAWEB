import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

type SectionHeadingProps = {
  eyebrow?: string | undefined;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string | undefined;
};

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {lead ? (
        <p className="mt-5 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
          {lead}
        </p>
      ) : null}
    </Reveal>
  );
}
