import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

interface PagePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
}

export function PagePlaceholder({ eyebrow, title, description, note }: PagePlaceholderProps) {
  return (
    <>
      <section className="hero-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
            {description}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Coming soon
          </span>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">{note}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/join"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
            >
              Join Us
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
