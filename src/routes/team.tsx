import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, CalendarCheck } from "lucide-react";

import { PageHero } from "@/components/fx/page-hero";
import { Reveal } from "@/components/fx/reveal";
import { GhostCta, PrimaryCta } from "@/components/fx/cta";
import { Photo } from "@/components/fx/photo";
import { TEAMS, type Role } from "@/lib/teams";
import { FALLBACK_TEAM_ICON, TEAM_ICONS } from "@/lib/team-icons";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

type TeamSearch = { team?: string };

export const Route = createFileRoute("/team")({
  validateSearch: (search: Record<string, unknown>): TeamSearch => {
    const team = search["team"];
    return typeof team === "string" ? { team } : {};
  },
  head: () => ({
    meta: [
      { title: `Team · ${SITE.name}` },
      {
        name: "description",
        content:
          "The teams behind the ISACA Student Chapter at Alfaisal University. All roles are open.",
      },
      { property: "og:title", content: `Team · ${SITE.name}` },
      {
        property: "og:description",
        content: "The teams behind the chapter. All roles are open.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function ApplyLink({ team, role }: { team: string; role: string }) {
  return (
    <Link
      to="/join"
      search={{ team, role }}
      className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-teal"
    >
      Apply for this role
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function DirectorCard({ role, team }: { role: Role; team: string }) {
  return (
    <article className="panel flex h-full flex-col p-7">
      <h4 className="font-display text-xl leading-snug font-bold tracking-[-0.02em]">
        {role.title}
      </h4>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {role.responsibility}
      </p>
      <ApplyLink team={team} role={role.title} />
    </article>
  );
}

function MemberCard({ role, team }: { role: Role; team: string }) {
  return (
    <article className="panel flex h-full flex-col p-6">
      <h4 className="font-display text-base leading-snug font-semibold">{role.title}</h4>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {role.responsibility}
      </p>
      <ApplyLink team={team} role={role.title} />
    </article>
  );
}

function TeamPage() {
  const { team: requested } = Route.useSearch();
  const reduce = useReducedMotion();
  const indexFor = (title: string | undefined) =>
    Math.max(
      0,
      TEAMS.findIndex((t) => t.title === title),
    );
  const [index, setIndex] = useState(() => indexFor(requested));

  // Follow the ?team= param when it changes while already on this page.
  useEffect(() => {
    if (requested) setIndex(indexFor(requested));
  }, [requested]);

  const team = TEAMS[index];
  if (!team) return null;
  const totalRoles = TEAMS.reduce((n, t) => n + t.directors.length + t.members.length, 0);

  return (
    <>
      <PageHero
        title={
          <>
            The teams <span className="text-brand-teal">behind the chapter</span>
          </>
        }
        lead="We are building the founding team. Every role listed below is open. If a path fits you, join the chapter and let us know."
        aside={
          <Photo
            name="audience"
            alt="Students seated in the auditorium during the chapter's opening event."
            sizes="(min-width: 1024px) 480px, 100vw"
            className="aspect-[3/2]"
            priority
          />
        }
      >
        <p className="tabular inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-green" aria-hidden="true" />
          {TEAMS.length} teams, {totalRoles} open roles
        </p>
      </PageHero>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        {/* Team switcher */}
        <Reveal>
          <div
            role="tablist"
            aria-label="Teams"
            className="flex flex-wrap gap-2 rounded-full sm:inline-flex sm:bg-white/[0.04] sm:p-1.5"
          >
            {TEAMS.map((t, i) => {
              const selected = i === index;
              const TabIcon = TEAM_ICONS[t.title] ?? FALLBACK_TEAM_ICON;
              return (
                <button
                  key={t.title}
                  type="button"
                  role="tab"
                  id={`team-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={`team-panel-${i}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors sm:border-transparent",
                    selected
                      ? "border-brand-teal/40 text-foreground"
                      : "border-white/10 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {selected ? (
                    <motion.span
                      layoutId="team-active"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <TabIcon className="relative h-4 w-4" />
                  <span className="relative">{t.title}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={team.title}
            role="tabpanel"
            id={`team-panel-${index}`}
            aria-labelledby={`team-tab-${index}`}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            {...(reduce ? {} : { exit: { opacity: 0, y: -12 } })}
            transition={{ duration: 0.4, ease: EASE }}
            className="mt-10"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                  {team.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {team.description}
                </p>
              </div>
              <p className="tabular text-sm font-medium text-muted-foreground">
                {team.directors.length + team.members.length} open roles
              </p>
            </div>

            {/* Leadership */}
            <div className="mt-10 flex items-center gap-4">
              <h3 className="text-sm font-semibold text-brand-teal">Leadership</h3>
              <span className="h-px flex-1 bg-white/10" />
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                <CalendarCheck className="h-3.5 w-3.5 text-brand-teal" aria-hidden="true" />
                Includes a short online chat
              </span>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {team.directors.map((role) => (
                <DirectorCard key={role.title} role={role} team={team.title} />
              ))}
            </div>

            {/* Members */}
            <div className="mt-12 flex items-center gap-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Members</h3>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {team.members.map((role) => (
                <MemberCard key={role.title} role={role} team={team.title} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 md:pb-32">
        <Reveal>
          <div className="panel relative overflow-hidden p-8 text-center sm:p-12">
            <div className="relative">
              <h2 className="mx-auto max-w-xl font-display text-3xl font-bold tracking-[-0.03em] text-balance sm:text-4xl">
                Join first. Pick a team once you have met everyone.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                The form lets you choose “Not sure yet”. We would love to hear from you either way.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <PrimaryCta to="/join">Join the chapter</PrimaryCta>
                <GhostCta to="/events">See what we are planning</GhostCta>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
