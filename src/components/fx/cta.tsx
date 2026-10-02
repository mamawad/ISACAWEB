import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type InternalPath = "/" | "/join" | "/mission" | "/events" | "/team";

type CtaProps = {
  children: ReactNode;
  /** Internal route. Ignored when `href` is set. */
  to?: InternalPath | undefined;
  /** External URL — opens in a new tab and gets the outbound arrow. */
  href?: string | undefined;
  className?: string | undefined;
  size?: "sm" | "md" | "lg";
  icon?: boolean;
};

function Cta({
  variant,
  children,
  to,
  href,
  className,
  size = "md",
  icon = true,
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
          className={cn(
            "relative h-4 w-4 shrink-0 transition-transform duration-300",
            href
              ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              : "group-hover:translate-x-1",
          )}
        />
      ) : null}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {inner}
    </a>
  ) : (
    <Link to={to ?? "/"} className={classes}>
      {inner}
    </Link>
  );
}

export function PrimaryCta(props: CtaProps) {
  return <Cta variant="primary" {...props} />;
}

export function GhostCta(props: CtaProps) {
  return <Cta variant="ghost" {...props} />;
}
