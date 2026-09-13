import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  CalendarClock,
  Cpu,
  FlaskConical,
  Mic2,
  Presentation,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { PageHero } from "@/components/fx/page-hero";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { SectionHeading } from "@/components/fx/section-heading";
import { TiltCard } from "@/components/fx/tilt-card";
import { GhostCta, PrimaryCta } from "@/components/fx/cta";
import { SITE, mailto } from "@/lib/site";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: `Events · ${SITE.name}` },
      {
        name: "description",
        content:
          "Workshops and sessions planned by the ISACA Student Chapter at Alfaisal University. Details coming soon.",
      },
      { property: "og:title", content: `Events · ${SITE.name}` },
      {
        property: "og:description",
        content: "Workshops and sessions planned by the chapter. Details coming soon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

const PLANNED_EVENTS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Box,
    title: "3D Design",
    description:
      "A hands-on workshop or session introducing 3D design fundamentals and tooling. Exact format and scope to be confirmed.",
  },
  {
    icon: Cpu,
    title: "PCB Design",
    description:
      "A practical session on printed circuit board design, from schematic to layout. Details and prerequisites to be confirmed.",
  },
];

const FORMATS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Presentation,
    title: "Workshops",
    description:
      "Guided, step-by-step sessions on a tool or technique — bring a laptop and leave having built something.",
  },
  {
    icon: FlaskConical,
    title: "Hands-on labs",
    description:
      "Longer practical sessions run by the Academic & Technical Programs team, where the learning is in the doing.",
  },
  {
    icon: Mic2,
    title: "Guest talks",
    description:
      "Practitioners from the field sharing how the work actually looks — and taking your questions.",
  },
  {
    icon: Trophy,
    title: "Competition prep",
    description:
      "Preparation for CTFs and hackathons: team formation, practice sets, and strategy.",
  },
];

function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="Events"
        title={
          <>
            What we are <span className="text-gradient">planning</span>
          </>
        }
        lead="Hands-on workshops and sessions on design, security, and the tools behind modern systems, shaped by what members want to learn. This is a look ahead, not a fixed calendar."
      />

      {/* Planned sessions */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <SectionHeading
          eyebrow="On the board"
          title="First sessions in the works"
          lead="Two sessions are being scoped now. Dates, venues, and sign-ups will be announced here and on our socials."
        />
        <Stagger className="mt-12 grid gap-6 md:grid-cols-2">
          {PLANNED_EVENTS.map(({ icon: Icon, title, description }, i) => (
            <StaggerItem key={title} className="h-full">
              <TiltCard className="card-glow flex h-full flex-col p-7 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-teal/12 text-brand-teal ring-1 ring-brand-teal/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Details soon
                  </span>
                </div>
                <p className="mt-6 font-mono text-xs text-muted-foreground/60">Session 0{i + 1}</p>
                <h3 className="mt-1 font-display text-2xl font-bold tracking-tight">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal delay={0.1}>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            More events will be announced as we launch.
          </p>
        </Reveal>
      </section>

      {/* Formats */}
      <section className="section-tint border-y border-white/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <SectionHeading
            align="center"
            eyebrow="Formats"
            title="The shapes our sessions take"
            lead="Different goals need different rooms. These are the formats we are planning around."
          />
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FORMATS.map(({ icon: Icon, title, description }) => (
              <StaggerItem key={title} className="h-full">
                <TiltCard className="card-glow h-full p-6">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-blue/12 text-brand-blue ring-1 ring-brand-blue/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </TiltCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal>
          <div className="card-glow relative overflow-hidden p-8 sm:p-12 md:flex md:items-center md:justify-between md:gap-10 md:p-14">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_50%_90%_at_0%_50%,color-mix(in_oklab,var(--brand-teal)_18%,transparent),transparent_70%)]"
            />
            <div className="relative max-w-xl">
              <p className="eyebrow">Shape the calendar</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Want a say in what we run next?
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Members help decide the schedule. Join to vote with your attendance, or send us a
                session you would like to see.
              </p>
            </div>
            <div className="relative mt-8 flex flex-wrap gap-3 md:mt-0 md:shrink-0 md:flex-col">
              <PrimaryCta to="/join">Join to shape the schedule</PrimaryCta>
              <GhostCta href={mailto("Session idea for the ISACA Student Chapter")}>
                Propose a session
              </GhostCta>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
