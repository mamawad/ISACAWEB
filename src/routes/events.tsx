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
import { Photo } from "@/components/fx/photo";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { SectionHeading } from "@/components/fx/section-heading";
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
        title={
          <>
            What we are <span className="text-brand-teal">planning</span>
          </>
        }
        lead="Hands-on workshops and sessions on design, security, and the tools behind modern systems, shaped by what members want to learn. This is a look ahead, not a fixed calendar."
        aside={
          <div>
            <Photo
              name="stage"
              alt="A chapter organiser presenting on stage at Alfaisal University, beside a slide reading: Not a club. A branch of a global professional body."
              sizes="(min-width: 1024px) 480px, 100vw"
              className="aspect-[3/2]"
              priority
            />
            <p className="mt-4 text-sm text-muted-foreground">
              It started at the chapter's opening event. Everything below is what comes next.
            </p>
          </div>
        }
      />

      {/* Planned sessions */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
        <SectionHeading
          title="First sessions in the works"
          lead="Two sessions are being scoped now. Dates, venues, and sign-ups will be announced here and on our socials."
        />
        <Stagger className="mt-12 grid gap-5 md:grid-cols-2">
          {PLANNED_EVENTS.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title} className="h-full">
              <article className="panel flex h-full flex-col p-7 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <Icon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    Details soon
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold tracking-[-0.025em]">
                  {title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
        <p className="mt-8 text-sm text-muted-foreground">
          More events will be announced as we launch.
        </p>
      </section>

      {/* Formats */}
      <section className="section-tint border-y border-white/5">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:px-6 md:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            title="The shapes our sessions take"
            lead="Different goals need different rooms. These are the formats we are planning around."
          />
          <Stagger className="grid content-start gap-x-10 sm:grid-cols-2">
            {FORMATS.map(({ icon: Icon, title, description }) => (
              <StaggerItem key={title} className="border-t border-white/10 py-6">
                <h3 className="flex items-center gap-3 font-display text-lg font-semibold">
                  <Icon className="h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
        <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl leading-[1.05] font-extrabold tracking-[-0.035em] text-balance sm:text-5xl">
              Want a say in what we run next?
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Members help decide the schedule. Join to vote with your attendance, or send us a
              session you would like to see.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:shrink-0">
            <PrimaryCta to="/join">Join to shape the schedule</PrimaryCta>
            <GhostCta href={mailto("Session idea for the ISACA Student Chapter")}>
              Propose a session
            </GhostCta>
          </div>
        </Reveal>
      </section>
    </>
  );
}
