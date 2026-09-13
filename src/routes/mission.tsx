import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Award, Network, Users, Wrench, type LucideIcon } from "lucide-react";

import { PageHero } from "@/components/fx/page-hero";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { SectionHeading } from "@/components/fx/section-heading";
import { TiltCard } from "@/components/fx/tilt-card";
import { GhostCta, PrimaryCta } from "@/components/fx/cta";
import { Orb3D } from "@/components/three/orb-3d";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/mission")({
  head: () => ({
    meta: [
      { title: `Mission · ${SITE.name}` },
      {
        name: "description",
        content:
          "The mission of the ISACA Student Chapter at Alfaisal University: connecting students with IT governance, risk, cybersecurity, and audit.",
      },
      { property: "og:title", content: `Mission · ${SITE.name}` },
      {
        property: "og:description",
        content:
          "Connecting students with the knowledge, community, and opportunities to grow into industry-ready professionals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionPage,
});

const OFFERINGS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Users,
    title: "Community",
    description:
      "A peer group of students who share your interest in security, governance, and audit. You do not have to figure it out alone.",
  },
  {
    icon: Award,
    title: "Certifications",
    description:
      "Exposure to the certifications that matter in the field, including CISA and CISM, and the paths behind them.",
  },
  {
    icon: Wrench,
    title: "Hands-on events",
    description:
      "Workshops and sessions that turn theory into practical skill, led by members and guest speakers.",
  },
  {
    icon: Network,
    title: "Networking",
    description:
      "Connections to the wider ISACA professional community and the people already working in the field.",
  },
];

function MissionPage() {
  return (
    <>
      <PageHero
        eyebrow="Mission & About"
        title={
          <>
            What we are building, <span className="text-gradient">and why it matters</span>
          </>
        }
        lead="Our chapter connects Alfaisal students with the knowledge, community, and certifications behind careers in information security and assurance."
        aside={
          <div className="relative aspect-square">
            <Orb3D />
          </div>
        }
      />

      {/* Mission statement */}
      <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal>
          <figure className="card-glow relative overflow-hidden p-8 sm:p-12 md:p-14">
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-teal/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-blue/10 blur-3xl"
            />
            <figcaption className="eyebrow relative">Our mission</figcaption>
            <blockquote className="relative mt-6 border-l-2 border-brand-teal pl-6 font-display text-2xl leading-snug font-semibold tracking-tight text-balance sm:text-3xl md:text-[2.1rem]">
              The ISACA Student Chapter at Alfaisal University connects students interested in IT
              governance, risk management, cybersecurity, and audit with the knowledge, community,
              and opportunities to grow into industry-ready professionals. We bridge the gap between
              the classroom and the certifications, tools, and networks that define careers in
              information security and assurance.
            </blockquote>
          </figure>
        </Reveal>
      </section>

      {/* What is ISACA + What we're building */}
      <section className="section-tint border-y border-white/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <div className="grid gap-14 md:grid-cols-2 md:gap-16">
            <div>
              <SectionHeading
                eyebrow="What is ISACA?"
                title="A global body, brought to campus"
                lead="ISACA is the global professional organization behind industry-leading certifications like CISA and CISM, and a worldwide network of practitioners in IT governance, risk, cybersecurity, and audit. Our chapter brings that world to Alfaisal, so students can explore the field, build real skills, and meet the people already in it before they graduate."
              />
              <Reveal delay={0.1} className="mt-8">
                <a
                  href={SITE.isacaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-teal"
                >
                  Visit isaca.org
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Reveal>
            </div>

            <div>
              <SectionHeading
                eyebrow="What we are building"
                title="In progress, not all live yet"
                lead="The chapter is new. Here is what we are working toward, framed honestly as what we are building, since not everything is running yet. Join now and you help shape it from the start."
              />
              <Stagger className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {OFFERINGS.map(({ icon: Icon, title, description }) => (
                  <StaggerItem key={title}>
                    <TiltCard className="card-glow h-full p-5">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-teal/12 text-brand-teal ring-1 ring-brand-teal/20">
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
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal>
          <div className="card-glow relative overflow-hidden p-8 text-center sm:p-12 md:p-16">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,color-mix(in_oklab,var(--brand-teal)_25%,transparent),transparent_70%)]"
            />
            <div className="relative">
              <p className="eyebrow">Founding members wanted</p>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
                Help shape it <span className="text-gradient">from the start.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Join the Alfaisal chapter to be part of the student community, or the Riyadh chapter
                for the wider professional network. Or both.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <PrimaryCta to="/join">Join the Alfaisal chapter</PrimaryCta>
                <GhostCta href={SITE.riyadhChapterUrl}>Join the Riyadh chapter</GhostCta>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
