import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Gauge,
  LockKeyhole,
  Scale,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Hero3D } from "@/components/three/hero-3d";
import { Orb3D } from "@/components/three/orb-3d";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { TiltCard } from "@/components/fx/tilt-card";
import { Marquee } from "@/components/fx/marquee";
import { SectionHeading } from "@/components/fx/section-heading";
import { GhostCta, PrimaryCta } from "@/components/fx/cta";
import { CERTIFICATIONS, CERT_NOTE } from "@/lib/certifications";
import { TEAMS } from "@/lib/teams";
import { FALLBACK_TEAM_ICON, TEAM_ICONS } from "@/lib/team-icons";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SITE.name },
      {
        name: "description",
        content:
          "The ISACA Student Chapter at Alfaisal University is a student community for IT governance, risk, cybersecurity, and audit. Join us.",
      },
      { property: "og:title", content: SITE.name },
      {
        property: "og:description",
        content:
          "A student community at Alfaisal University for IT governance, risk, cybersecurity, and audit. Join the chapter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PILLARS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Scale,
    title: "Governance",
    description: "The frameworks that keep organizations accountable, transparent, and secure.",
  },
  {
    icon: Gauge,
    title: "Risk Management",
    description: "Identify, assess, and manage the risks that define modern digital systems.",
  },
  {
    icon: LockKeyhole,
    title: "Cybersecurity",
    description: "Hands-on exposure to defending networks, data, and the people who rely on them.",
  },
  {
    icon: ClipboardCheck,
    title: "IT Audit",
    description: "Learn how audits assure the controls and trust that organizations are built on.",
  },
];

const MARQUEE = [
  "Governance",
  "Risk Management",
  "Cybersecurity",
  "IT Audit",
  "CISA",
  "CISM",
  "CRISC",
  "CGEIT",
  "COBIT",
  "Alfaisal University",
  "Riyadh",
];

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: UserPlus,
    title: "Sign up with your Alfaisal email",
    text: "The form takes about a minute. You will need your student ID and an @alfaisal.edu address.",
  },
  {
    icon: Users,
    title: "Pick a team and a role — or not yet",
    text: "Choose where you want to contribute, or select “Not sure yet” and decide once you have met everyone.",
  },
  {
    icon: CalendarCheck,
    title: "Leadership applicants book a short chat",
    text: "Director and Associate Director applicants pick a 10-minute online slot on the same form. Everyone else is done.",
  },
];

const ALFAISAL_POINTS = [
  "Student-led, on campus at Alfaisal",
  "Workshops, sessions, and four teams to join",
  "Open to any Alfaisal student — sign-up takes a minute",
];

const RIYADH_POINTS = [
  "The professional ISACA chapter for the city",
  "Practitioner events and a wider network",
  "Run by ISACA Riyadh, independent of the university",
];

function Index() {
  return (
    <>
      <Hero />
      <MarqueeStrip />
      <WhyIsaca />
      <TwoChapters />
      <CertificationExplorer />
      <TeamsPreview />
      <HowItWorks />
      <FinalCta />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="grid-lines absolute inset-0" aria-hidden="true" />
      <Hero3D />
      {/* Keep the copy legible where the logo sits behind it on phones */}
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/70 via-background/20 to-transparent md:hidden"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-32 pb-28 sm:px-6 md:pt-36">
        <div className="max-w-2xl">
          <motion.div
            {...rise(0)}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand-green" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-green" />
            </span>
            Alfaisal University · Student Organization
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            className="mt-6 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-balance sm:text-6xl md:text-7xl"
          >
            ISACA Student <span className="text-gradient">Chapter</span>
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground sm:text-xl"
          >
            A student community at Alfaisal for IT governance, risk, cybersecurity, and audit. Learn
            the skills behind the field, meet the people already in it, and start building a career
            before you graduate.
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-9 flex flex-wrap items-center gap-3">
            <PrimaryCta to="/join" size="lg">
              Join the Alfaisal chapter
            </PrimaryCta>
            <GhostCta href={SITE.riyadhChapterUrl} size="lg">
              Join the Riyadh chapter
            </GhostCta>
          </motion.div>

          <motion.p
            {...rise(0.32)}
            className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground/80"
          >
            You can join both. The Alfaisal chapter is the student community here; the Riyadh
            chapter is the wider professional body in the city.{" "}
            <Link
              to="/mission"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Learn our mission
            </Link>
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground/70"
        aria-hidden="true"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Scroll</span>
        <span className="block h-9 w-px overflow-hidden bg-white/10">
          <motion.span
            className="block h-full w-full bg-brand-teal"
            {...(reduce ? {} : { animate: { y: ["-100%", "100%"] } })}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function MarqueeStrip() {
  return (
    <section className="border-y border-white/5 bg-surface/40 py-5" aria-label="Focus areas">
      <Marquee duration={55}>
        {MARQUEE.map((item) => (
          <span
            key={item}
            className="flex items-center gap-5 font-display text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase"
          >
            <span>{item}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-teal/70" aria-hidden="true" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function WhyIsaca() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <div className="grid gap-14 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-20">
        <div>
          <SectionHeading
            eyebrow="Why ISACA"
            title={
              <>
                A community for students who want to{" "}
                <span className="text-gradient">go further</span>
              </>
            }
            lead="ISACA is the global professional body behind certifications like CISA and CISM. Our chapter brings that world to Alfaisal. Through workshops, networking, and real industry insight, you can explore governance, risk, cybersecurity, and audit alongside other students before you graduate."
          />
          <Reveal delay={0.15} className="mt-8">
            <Link
              to="/join"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-teal"
            >
              Become a member
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, description }, i) => (
            <StaggerItem key={title}>
              <TiltCard className="card-glow h-full p-6">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-teal/12 text-brand-teal ring-1 ring-brand-teal/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground/60">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function ChapterCard({
  eyebrow,
  title,
  points,
  action,
  accent,
}: {
  eyebrow: string;
  title: string;
  points: string[];
  action: React.ReactNode;
  accent: "teal" | "blue";
}) {
  return (
    <TiltCard className="card-glow flex h-full flex-col p-8">
      <p className={cn("eyebrow", accent === "blue" && "text-brand-blue")}>{eyebrow}</p>
      <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">{title}</h3>
      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
            <span
              className={cn(
                "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                accent === "blue"
                  ? "bg-brand-blue/15 text-brand-blue"
                  : "bg-brand-teal/15 text-brand-teal",
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-8">{action}</div>
    </TiltCard>
  );
}

function TwoChapters() {
  return (
    <section className="section-tint relative overflow-hidden border-y border-white/5">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-28">
        <SectionHeading
          align="center"
          eyebrow="Two chapters, one field"
          title="Alfaisal is the student community. Riyadh is the professional one."
          lead="They are independent, so you can join either or both. Most members start here on campus and add the Riyadh chapter when they want the wider network."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Reveal>
            <ChapterCard
              eyebrow="You are here"
              title="ISACA Student Chapter, Alfaisal"
              points={ALFAISAL_POINTS}
              accent="teal"
              action={
                <PrimaryCta to="/join" magnetic={false}>
                  Join the Alfaisal chapter
                </PrimaryCta>
              }
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ChapterCard
              eyebrow="The wider network"
              title="ISACA Riyadh Chapter"
              points={RIYADH_POINTS}
              accent="blue"
              action={
                <GhostCta href={SITE.riyadhChapterUrl} magnetic={false}>
                  Join the Riyadh chapter
                </GhostCta>
              }
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function CertificationExplorer() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const cert = CERTIFICATIONS[active];
  if (!cert) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <SectionHeading
        eyebrow="Certification pathways"
        title={
          <>
            Know the map before you <span className="text-gradient">pick a route</span>
          </>
        }
        lead="ISACA credentials cover the whole field. Tap through to see what each one is for and who it suits."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div
          role="tablist"
          aria-label="ISACA certifications"
          className="flex flex-wrap gap-2 lg:flex-col"
        >
          {CERTIFICATIONS.map((c, i) => {
            const selected = i === active;
            return (
              <button
                key={c.code}
                type="button"
                role="tab"
                id={`cert-tab-${c.code}`}
                aria-selected={selected}
                aria-controls={`cert-panel-${c.code}`}
                onClick={() => setActive(i)}
                className={cn(
                  "relative flex items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors lg:px-5 lg:py-4",
                  selected
                    ? "border-brand-teal/40 text-foreground"
                    : "border-white/8 text-muted-foreground hover:border-white/15 hover:text-foreground",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId="cert-active"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-2xl bg-brand-teal/10"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                ) : null}
                <span className="relative font-mono text-sm font-semibold tracking-wide">
                  {c.code}
                </span>
                <span className="relative hidden text-sm sm:inline">{c.name}</span>
              </button>
            );
          })}
        </div>

        <div>
          <div className="relative min-h-[360px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={cert.code}
                role="tabpanel"
                id={`cert-panel-${cert.code}`}
                aria-labelledby={`cert-tab-${cert.code}`}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                {...(reduce ? {} : { exit: { opacity: 0, y: -14 } })}
                transition={{ duration: 0.35, ease: EASE }}
                className="card-glow h-full p-8 sm:p-10"
              >
                <span className="inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-1 font-mono text-xs tracking-[0.18em] text-brand-teal uppercase">
                  {cert.domain}
                </span>
                <h3 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  <span className="text-gradient">{cert.code}</span>
                </h3>
                <p className="mt-2 font-display text-lg font-semibold text-foreground/90">
                  {cert.name}
                </p>
                <p className="mt-2 text-sm font-medium text-brand-teal">{cert.tagline}</p>
                <p className="mt-5 leading-relaxed text-muted-foreground">{cert.description}</p>
                <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="eyebrow">Best for</p>
                  <p className="mt-2 text-sm leading-relaxed">{cert.bestFor}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground/80">
            {CERT_NOTE} Current requirements live on{" "}
            <a
              href={SITE.isacaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              isaca.org
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function TeamsPreview() {
  return (
    <section className="section-tint relative overflow-hidden border-y border-white/5">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Teams"
            title="Four teams. Every role open."
            lead="We are building the founding team. Pick the work you want to be known for."
          />
          <Reveal delay={0.1}>
            <GhostCta to="/team">See all roles</GhostCta>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEAMS.map((team) => {
            const Icon = TEAM_ICONS[team.title] ?? FALLBACK_TEAM_ICON;
            const roles = team.directors.length + team.members.length;
            return (
              <StaggerItem key={team.title} className="h-full">
                <Link to="/team" search={{ team: team.title }} className="block h-full">
                  <TiltCard className="card-glow flex h-full flex-col p-6">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-blue/12 text-brand-blue ring-1 ring-brand-blue/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-display text-lg leading-snug font-semibold">
                      {team.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {team.description}
                    </p>
                    <p className="mt-5 inline-flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-brand-teal uppercase">
                      {roles} open roles
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </p>
                  </TiltCard>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <SectionHeading
        align="center"
        eyebrow="How joining works"
        title="Three steps, one form"
        lead="No interviews for members. Leadership applicants add one short online chat."
      />
      <Stagger className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        <div
          aria-hidden="true"
          className="absolute top-8 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-brand-teal via-brand-green to-brand-blue opacity-40 md:block"
        />
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <StaggerItem key={step.title}>
              <div className="relative flex flex-col items-center text-center md:items-start md:text-left">
                <div className="glass relative grid h-16 w-16 place-items-center rounded-2xl">
                  <Icon className="h-6 w-6 text-brand-teal" />
                  <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-brand-teal font-mono text-[11px] font-bold text-navy-deep">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/5">
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-24 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-32">
        <Reveal>
          <p className="eyebrow">Ready to get involved?</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Your first step into the field is <span className="text-gradient">one form away.</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Membership is open to any Alfaisal student curious about the field. It takes a minute,
            and it is the first step into the community.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryCta to="/join" size="lg">
              Join the Alfaisal chapter
            </PrimaryCta>
            <GhostCta href={SITE.riyadhChapterUrl} size="lg">
              Join the Riyadh chapter
            </GhostCta>
          </div>
        </Reveal>
        <div className="relative hidden aspect-square md:block">
          <Orb3D />
        </div>
      </div>
    </section>
  );
}
