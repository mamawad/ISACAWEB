import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Award, Network, Users, Wrench, type LucideIcon } from "lucide-react";

import { PageHero } from "@/components/fx/page-hero";
import { Photo } from "@/components/fx/photo";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { SectionHeading } from "@/components/fx/section-heading";
import { GhostCta, PrimaryCta } from "@/components/fx/cta";
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
        title={
          <>
            What we are building, and <span className="text-brand-teal">why it matters</span>
          </>
        }
        lead="Our chapter connects Alfaisal students with the knowledge, community, and certifications behind careers in information security and assurance."
        aside={
          <Photo
            name="theory"
            alt="A chapter organiser on stage beside a slide reading: University teaches the theory. Industry hires for the proof."
            sizes="(min-width: 1024px) 480px, 100vw"
            className="aspect-[3/2]"
            priority
          />
        }
      />

      {/* Mission statement */}
      <section className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-6 md:py-32">
        <Reveal>
          <h2 className="text-sm font-semibold text-brand-teal">Our mission</h2>
          <blockquote className="mt-6 font-display text-2xl leading-[1.3] font-semibold tracking-[-0.02em] text-balance sm:text-3xl md:text-[2.25rem]">
            The ISACA Student Chapter at Alfaisal University connects students interested in IT
            governance, risk management, cybersecurity, and audit with the knowledge, community, and
            opportunities to grow into industry-ready professionals.{" "}
            <span className="text-muted-foreground">
              We bridge the gap between the classroom and the certifications, tools, and networks
              that define careers in information security and assurance.
            </span>
          </blockquote>
        </Reveal>
      </section>

      {/* What is ISACA + What we're building */}
      <section className="section-tint border-y border-white/5">
        <div className="mx-auto grid w-full max-w-6xl gap-16 px-4 py-24 sm:px-6 md:py-28 lg:grid-cols-2">
          <div>
            <SectionHeading
              title="A global body, brought to campus"
              lead="ISACA is the global professional organization behind industry-leading certifications like CISA and CISM, and a worldwide network of practitioners in IT governance, risk, cybersecurity, and audit. Our chapter brings that world to Alfaisal, so students can explore the field, build real skills, and meet the people already in it before they graduate."
            />
            <Reveal delay={0.08} className="mt-8">
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
              title="In progress, not all live yet"
              lead="The chapter is new. Here is what we are working toward, framed honestly as what we are building, since not everything is running yet. Join now and you help shape it from the start."
            />
            <Stagger className="mt-6 grid gap-x-10 sm:grid-cols-2">
              {OFFERINGS.map(({ icon: Icon, title, description }) => (
                <StaggerItem key={title} className="border-t border-white/10 py-6">
                  <h3 className="flex items-center gap-3 font-display text-lg font-semibold">
                    <Icon className="h-5 w-5 shrink-0 text-brand-teal" aria-hidden="true" />
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl leading-[1.05] font-extrabold tracking-[-0.035em] text-balance sm:text-5xl">
            Help shape it from the start.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Join the Alfaisal chapter to be part of the student community, or the Riyadh chapter for
            the wider professional network. Or both.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <PrimaryCta to="/join">Join the Alfaisal chapter</PrimaryCta>
            <GhostCta href={SITE.riyadhChapterUrl}>Join the Riyadh chapter</GhostCta>
          </div>
        </Reveal>
      </section>
    </>
  );
}
