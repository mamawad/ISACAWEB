import { Link } from "@tanstack/react-router";
import { ArrowRight, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { TiltCard } from "@/components/fx/tilt-card";
import { NATIONAL_DAY } from "@/lib/national-day";
import { Palm } from "./palm";
import { SaduBand } from "./sadu-band";
import { useNationalDay } from "./use-national-day";

const FACTS = [
  {
    icon: Landmark,
    figure: "1932",
    label: "Unification",
    text: "King Abdulaziz united the Kingdom on 23 September 1932 — the day the nation marks every year.",
  },
  {
    icon: Sparkles,
    figure: String(NATIONAL_DAY.edition),
    label: "National Day",
    text: `This year marks the ${NATIONAL_DAY.edition}th celebration — and the chapter celebrates it alongside the whole Kingdom.`,
  },
  {
    icon: ShieldCheck,
    figure: "2030",
    label: "Vision",
    text: "A digital Kingdom runs on trust — the governance, risk, security and audit work this chapter exists to teach.",
  },
] as const;

/**
 * Homepage feature for the National Day season. Renders nothing outside it.
 */
export function NationalDaySection() {
  const { active } = useNationalDay();
  if (!active) return null;

  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <SaduBand height={18} />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_20%_40%,color-mix(in_oklab,var(--ksa-green)_28%,transparent),transparent_70%),radial-gradient(ellipse_50%_50%_at_90%_80%,color-mix(in_oklab,var(--ksa-gold)_12%,transparent),transparent_70%)]"
      />
      <Palm className="palm-sway pointer-events-none absolute -bottom-2 -left-6 h-72 w-auto opacity-25 sm:h-96" />
      <Palm className="palm-sway pointer-events-none absolute -right-8 -bottom-2 hidden h-80 w-auto -scale-x-100 opacity-20 md:block" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-28">
        <div className="grid items-end gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <p className="eyebrow">23 September · {NATIONAL_DAY.greetingEn}</p>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl">
              {NATIONAL_DAY.edition} years of <span className="text-ksa">one Kingdom.</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              From Riyadh, the ISACA Student Chapter at Alfaisal wishes the Kingdom, its leadership
              and its people a happy National Day. The future being built here is digital — and it
              needs people who can keep it trustworthy.
            </p>
            <Link
              to="/join"
              className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ksa-green-bright)]"
            >
              Be part of what comes next
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <Reveal delay={0.1} className="text-right">
            <p
              lang="ar"
              dir="rtl"
              className="font-arabic text-5xl leading-tight text-white sm:text-6xl"
            >
              {NATIONAL_DAY.greetingAr}
            </p>
            <p
              lang="ar"
              aria-hidden="true"
              className="font-arabic mt-2 text-[7rem] leading-none sm:text-[9rem]"
            >
              <span className="text-ksa">{NATIONAL_DAY.editionAr}</span>
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-4 md:grid-cols-3">
          {FACTS.map(({ icon: Icon, figure, label, text }) => (
            <StaggerItem key={label}>
              <TiltCard className="card-glow h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--ksa-green)_35%,transparent)] text-[var(--ksa-green-bright)] ring-1 ring-[color-mix(in_oklab,var(--ksa-green-bright)_30%,transparent)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs tracking-[0.2em] text-[var(--ksa-gold)] uppercase">
                    {label}
                  </span>
                </div>
                <p className="mt-5 font-display text-4xl font-extrabold tracking-tight">{figure}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
      <SaduBand height={18} className="rotate-180" />
    </section>
  );
}
