import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Instagram, Linkedin, Mail } from "lucide-react";
import { SITE, mailto } from "@/lib/site";

const LINKS = [
  { to: "/mission", label: "Mission" },
  { to: "/events", label: "Events" },
  { to: "/team", label: "Team" },
  { to: "/join", label: "Join Us" },
] as const;

function TikTokIcon({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.85-3.56 3.01-5.86 3.09-1.69.07-3.39-.37-4.81-1.27-2.39-1.5-3.78-4.28-3.61-7.1.13-2.4 1.47-4.69 3.49-6.05 1.27-.86 2.81-1.35 4.37-1.36.04 1.47.06 2.94.09 4.41-.71-.21-1.49-.18-2.15.15-1.07.5-1.74 1.68-1.5 2.85.2 1.27 1.47 2.23 2.74 2.07 1.1-.12 2.03-1.02 2.28-2.08.06-.31.08-.62.08-.94.02-3.46.01-6.92.03-10.38z" />
    </svg>
  );
}

type SocialLabel = (typeof SITE.socials)[number]["label"];

const SOCIAL_ICONS: Record<SocialLabel, ComponentType<{ className?: string | undefined }>> = {
  Instagram,
  TikTok: TikTokIcon,
  LinkedIn: Linkedin,
};

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-navy-deep">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-[6vw] text-center font-display text-[24vw] leading-none font-extrabold tracking-tighter text-white/[0.025] select-none"
      >
        ISACA
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] md:py-20">
        <div>
          <Link
            to="/"
            className="inline-block rounded-xl bg-white p-2.5"
            aria-label={`${SITE.name} — home`}
          >
            <img src="/brand/isaca-lockup.png" alt="" className="h-9 w-auto" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A student-led community at Alfaisal University exploring IT governance, risk,
            cybersecurity, and audit. Not an official university site.
          </p>
          <div className="mt-6 flex items-center gap-2">
            {SITE.socials.map((s) => {
              const Icon = SOCIAL_ICONS[s.label];
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-brand-teal/50 hover:text-brand-teal"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <p className="eyebrow">Explore</p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Connect</p>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm font-medium text-muted-foreground">
            <li>
              <a
                href={mailto("ISACA Student Chapter - Alfaisal University")}
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                href={SITE.riyadhChapterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
              >
                ISACA Riyadh Chapter
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </li>
            <li>
              <a
                href={SITE.isacaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
              >
                ISACA Global
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {SITE.name}.
          </p>
          <p className="font-mono uppercase tracking-[0.18em]">Riyadh · Saudi Arabia</p>
        </div>
      </div>
    </footer>
  );
}
