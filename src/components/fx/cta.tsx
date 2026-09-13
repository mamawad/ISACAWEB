import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Magnetic } from "./magnetic";

type InternalPath = "/" | "/join" | "/mission" | "/events" | "/team";

type CtaProps = {
  children: ReactNode;
  /** Internal route. Ignored when `href` is set. */
  to?: InternalPath | undefined;
  /** External URL — opens in a new tab. */
  href?: string | undefined;
  className?: string | undefined;
  size?: "sm" | "md" | "lg";
  icon?: boolean;
  magnetic?: boolean;
};

function Cta({
  variant,
  children,
  to,
  href,
  className,
  size = "md",
  icon = true,
  magnetic = true,
}: CtaProps & { variant: "primary" | "ghost" }) {
  const classes = cn(
    "btn group",
    variant === "primary" ? "btn-primary" : "btn-ghost",
    size === "sm" && "btn-sm",
    size === "lg" && "btn-lg",
    className,
  );
  const Icon = href ? ArrowUpRight : ArrowRight;
  const inner = (
    <>
      <span className="relative">{children}</span>
      {icon ? (
        <Icon
          aria-hidden="true"
          className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px"
        />
      ) : null}
    </>
  );
  const el = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {inner}
    </a>
  ) : (
    <Link to={to ?? "/"} className={classes}>
      {inner}
    </Link>
  );
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}

export function PrimaryCta(props: CtaProps) {
  return <Cta variant="primary" {...props} />;
}

export function GhostCta(props: CtaProps) {
  return <Cta variant="ghost" {...props} />;
}
