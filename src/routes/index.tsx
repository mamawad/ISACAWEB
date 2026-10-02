import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  Gauge,
  LockKeyhole,
  Scale,
  type LucideIcon,
} from "lucide-react";

import { Hero3D } from "@/components/three/hero-3d";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { Marquee } from "@/components/fx/marquee";
import { Photo } from "@/components/fx/photo";
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
      { property: "og:image", content: "/photos/opening/stage-1600.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

const STEPS: { title: string; text: string }[] = [
  {
    title: "Sign up with your Alfaisal email",
    text: "The form takes about a minute. You will need your student ID and an @alfaisal.edu address.",
  },
  {
    title: "Pick a team and a role — or not yet",
    text: "Choose where you want to contribute, or select “Not sure yet” and decide once you have met everyone.",
  },
  {
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
      <OpeningNight />
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
  const sectionRef = useRef<HTMLElement>(null);

  // Feed the cursor position to the .spotlight layer as CSS variables.
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const el = sectionRef.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  }
  const settle = (delay: number) => ({
    initial: reduce ? false : { y: 22 },
    animate: { y: 0 },
    transition: { duration: 1.1, delay, ease: EASE },
  });

  return (
    <section ref={sectionRef} onPointerMove={onPointerMove} className="relative overflow-hidden">
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="spotlight pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-2 px-4 pt-28 pb-10 sm:px-6 lg:min-h-[100svh] lg:grid-cols-[1.08fr_0.92fr] lg:gap-6 lg:pt-32 lg:pb-12">
        <div className="relative z-10">
          <motion.h1
            {...settle(0)}
            className="font-display text-[3.1rem] leading-[0.98] font-extrabold tracking-[-0.04em] text-balance sm:text-7xl lg:text-[5.4rem]"
          >
            ISACA Student <span className="text-brand-teal">Chapter</span>
          </motion.h1>

          <motion.p
            {...settle(0.06)}
            className="mt-7 max-w-[34rem] text-lg leading-relaxed text-pretty text-muted-foreground sm:text-xl"
          >
            A student community at Alfaisal for IT governance, risk, cybersecurity, and audit. Learn
            the skills behind the field, meet the people already in it, and start building a career
            before you graduate.
          </motion.p>

          <motion.div {...settle(0.12)} className="mt-9 flex flex-wrap items-center gap-3">
            <PrimaryCta to="/join" size="lg">
              Join the Alfaisal chapter
            </PrimaryCta>
            <GhostCta href={SITE.riyadhChapterUrl} size="lg">
              Join the Riyadh chapter
            </GhostCta>
          </motion.div>

          <motion.p
            {...settle(0.18)}
            className="mt-6 max-w-[32rem] text-sm leading-relaxed text-muted-foreground"
          >
            You can join both. The Alfaisal chapter is the student community here; the Riyadh
            chapter is the wider professional body in the city.{" "}
            <Link
              to="/mission"
              className="font-medium text-foreground underline decoration-white/30 hover:decoration-brand-teal"
            >
              Learn our mission
            </Link>
          </motion.p>
        </div>

        <div className="relative h-[300px] sm:h-[400px] lg:h-[620px]">
          <Hero3D />
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-background"
        aria-hidden="true"
      />
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
            className="flex items-center gap-5 font-display text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase"
          >
            <span>{item}</span>
            <span className="h-1 w-1 rounded-full bg-brand-teal/70" aria-hidden="true" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function OpeningNight() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col lg:col-span-7">
          <Photo
            name="stage"
            alt="A chapter organiser presenting on stage at Alfaisal University, beside a slide reading: Not a club. A branch of a global professional body."
            sizes="(min-width: 1024px) 640px, 100vw"
            className="aspect-[3/2] lg:aspect-auto lg:min-h-[26rem] lg:flex-1"
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Opening night of the chapter, Alfaisal University.
          </p>
        </div>

        <div className="flex flex-col gap-10 lg:col-span-5 lg:pt-4">
          <Reveal>
            <h2 className="font-display text-3xl leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-4xl md:text-[2.75rem]">
              Not a club. A branch of a global professional body.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
              That was the opening line when the chapter launched at Alfaisal. ISACA is the
              professional body behind CISA and CISM, and this chapter is how students here plug
              into it.
            </p>
            <Link
              to="/events"
              className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand-teal"
            >
              See what comes next
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <Photo
            name="audience"
            alt="Students seated in the auditorium during the chapter's opening event."
            sizes="(min-width: 1024px) 440px, 100vw"
            className="aspect-[3/2]"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function WhyIsaca() {
  return (
    <section className="section-tint border-y border-white/5">
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeading
            title="A community for students who want to go further"
            lead="ISACA is the global professional body behind certifications like CISA and CISM. Our chapter brings that world to Alfaisal. Through workshops, networking, and real industry insight, you can explore governance, risk, cybersecurity, and audit alongside other students before you graduate."
          />
          <Reveal delay={0.08} className="mt-8">
            <Link
              to="/join"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-teal"
            >
              Become a member
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <Stagger className="grid content-start gap-x-10 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title} className="border-t border-white/10 py-7">
              <h3 className="flex items-center gap-3 font-display text-xl font-semibold tracking-[-0.02em]">
                <Icon className="h-5 w-5 shrink-0 text-brand-teal" aria-hidden="true" />
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function ChapterCard({
  title,
  badge,
  points,
  action,
  accent,
}: {
  title: string;
  badge: string;
  points: string[];
  action: React.ReactNode;
  accent: "teal" | "blue";
}) {
  return (
    <div className="panel flex h-full flex-col p-8 sm:p-9">
      <div className="flex flex-col items-start gap-3">
        <h3 className="font-display text-2xl font-bold tracking-[-0.025em]">{title}</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            accent === "blue"
              ? "bg-brand-blue/15 text-brand-blue"
              : "bg-brand-teal/15 text-brand-teal",
          )}
        >
          {badge}
        </span>
      </div>
      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                accent === "blue" ? "text-brand-blue" : "text-brand-teal",
              )}
              aria-hidden="true"
            />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-8">{action}</div>
    </div>
  );
}

function TwoChapters() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <SectionHeading
        title="Alfaisal is the student community. Riyadh is the professional one."
        lead="They are independent, so you can join either or both. Most members start here on campus and add the Riyadh chapter when they want the wider network."
      />
      <Stagger className="mt-14 grid gap-5 md:grid-cols-2">
        <StaggerItem>
          <ChapterCard
            title="ISACA Student Chapter, Alfaisal"
            badge="You are here"
            points={ALFAISAL_POINTS}
            accent="teal"
            action={<PrimaryCta to="/join">Join the Alfaisal chapter</PrimaryCta>}
          />
        </StaggerItem>
        <StaggerItem>
          <ChapterCard
            title="ISACA Riyadh Chapter"
            badge="The wider network"
            points={RIYADH_POINTS}
            accent="blue"
            action={<GhostCta href={SITE.riyadhChapterUrl}>Join the Riyadh chapter</GhostCta>}
          />
        </StaggerItem>
      </Stagger>
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
    <section className="section-tint border-y border-white/5">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
        <SectionHeading
          title="Know the map before you pick a route"
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
                      : "border-white/8 text-muted-foreground hover:border-white/20 hover:text-foreground",
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
                  <span className="relative w-14 font-mono text-sm font-semibold tracking-wide">
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
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  {...(reduce ? {} : { exit: { opacity: 0, y: -10 } })}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="panel h-full p-8 sm:p-10"
                >
                  <span className="inline-flex rounded-full bg-brand-teal/12 px-3 py-1 text-xs font-semibold text-brand-teal">
                    {cert.domain}
                  </span>
                  <h3 className="mt-5 font-mono text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                    {cert.code}
                  </h3>
                  <p className="mt-2 font-display text-lg font-semibold text-foreground/90">
                    {cert.name}
                  </p>
                  <p className="mt-2 text-sm font-medium text-brand-teal">{cert.tagline}</p>
                  <p className="mt-5 leading-relaxed text-muted-foreground">{cert.description}</p>
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <h4 className="text-sm font-semibold text-foreground">Best for</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {cert.bestFor}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              {CERT_NOTE} Current requirements live on{" "}
              <a
                href={SITE.isacaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                isaca.org
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function TeamsPreview() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          title="Four teams. Every role open."
          lead="We are building the founding team. Pick the work you want to be known for."
        />
        <Reveal delay={0.08}>
          <GhostCta to="/team">See all roles</GhostCta>
        </Reveal>
      </div>

      <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAMS.map((team) => {
          const Icon = TEAM_ICONS[team.title] ?? FALLBACK_TEAM_ICON;
          const roles = team.directors.length + team.members.length;
          return (
            <StaggerItem key={team.title} className="h-full">
              <Link
                to="/team"
                search={{ team: team.title }}
                className="panel group flex h-full flex-col p-6"
              >
                <Icon className="h-5 w-5 text-brand-blue" aria-hidden="true" />
                <h3 className="mt-5 font-display text-lg leading-snug font-semibold">
                  {team.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {team.description}
                </p>
                <p className="tabular mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal">
                  {roles} open roles
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </p>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function HowItWorks() {
  return (
    <section className="section-tint border-y border-white/5">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
        <SectionHeading
          title="Three steps, one form"
          lead="No interviews for members. Leadership applicants add one short online chat."
        />
        <Stagger className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <StaggerItem key={step.title} className="border-t border-white/10 pt-6">
              <span
                className="tabular font-display text-5xl leading-none font-extrabold text-brand-teal"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <h2 className="font-display text-4xl leading-[1.04] font-extrabold tracking-[-0.035em] text-balance sm:text-5xl md:text-6xl">
            Your first step into the field is one form away.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Membership is open to any Alfaisal student curious about the field. It takes a minute,
            and it is the first step into the community.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <PrimaryCta to="/join" size="lg">
              Join the Alfaisal chapter
            </PrimaryCta>
            <GhostCta href={SITE.riyadhChapterUrl} size="lg">
              Join the Riyadh chapter
            </GhostCta>
          </div>
        </Reveal>
        <Photo
          name="riyadh"
          alt="A chapter organiser on stage beside a slide reading: We're backed by the ISACA Riyadh Chapter."
          sizes="(min-width: 1024px) 520px, 100vw"
          className="aspect-[3/2]"
        />
      </div>
    </section>
  );
}
