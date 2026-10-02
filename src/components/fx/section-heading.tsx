import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

type SectionHeadingProps = {
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string | undefined;
};

export function SectionHeading({ title, lead, align = "left", className }: SectionHeadingProps) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-balance text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.08]">
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
