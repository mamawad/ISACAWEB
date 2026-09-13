import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, CalendarCheck, type LucideIcon } from "lucide-react";

import { PageHero } from "@/components/fx/page-hero";
import { Reveal } from "@/components/fx/reveal";
import { TiltCard } from "@/components/fx/tilt-card";
import { GhostCta, PrimaryCta } from "@/components/fx/cta";
import { Orb3D } from "@/components/three/orb-3d";
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

function DirectorCard({ role, team, Icon }: { role: Role; team: string; Icon: LucideIcon }) {
  return (
    <TiltCard className="card-glow flex h-full flex-col p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-teal/12 text-brand-teal ring-1 ring-brand-teal/20">
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-brand-teal uppercase">
          <CalendarCheck className="h-3 w-3" />
          Leadership
        </span>
      </div>
      <h3 className="mt-5 font-display text-lg leading-snug font-bold">{role.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {role.responsibility}
      </p>
      <ApplyLink team={team} role={role.title} />
    </TiltCard>
  );
}

function MemberCard({ role, team }: { role: Role; team: string }) {
  return (
    <TiltCard className="card-glow flex h-full flex-col p-5" max={6}>
      <h3 className="font-display text-base leading-snug font-semibold">{role.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {role.responsibility}
      </p>
      <ApplyLink team={team} role={role.title} />
    </TiltCard>
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
  const Icon = TEAM_ICONS[team.title] ?? FALLBACK_TEAM_ICON;
  const totalRoles = TEAMS.reduce((n, t) => n + t.directors.length + t.members.length, 0);

  return (
    <>
      <PageHero
        eyebrow="Team"
        title={
          <>
            The teams <span className="text-gradient">behind the chapter</span>
          </>
        }
        lead="We are building the founding team. Every role listed below is open. If a path fits you, join the chapter and let us know."
        aside={
          <div className="relative aspect-square">
            <Orb3D />
          </div>
        }
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
          {TEAMS.length} teams · {totalRoles} open roles
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
                <p className="eyebrow">
                  Team {index + 1} of {TEAMS.length}
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {team.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {team.description}
                </p>
              </div>
              <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
                {team.directors.length + team.members.length} open roles
              </p>
            </div>

            {/* Leadership */}
            <div className="mt-10 flex items-center gap-4">
              <span className="font-mono text-xs tracking-[0.2em] text-brand-teal uppercase">
                Leadership
              </span>
              <span className="h-px flex-1 bg-white/10" />
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Includes a short online chat
              </span>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {team.directors.map((role) => (
                <DirectorCard key={role.title} role={role} team={team.title} Icon={Icon} />
              ))}
            </div>

            {/* Members */}
            <div className="mt-12 flex items-center gap-4">
              <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Members
              </span>
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
          <div className="card-glow relative overflow-hidden p-8 text-center sm:p-12">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,color-mix(in_oklab,var(--brand-blue)_22%,transparent),transparent_70%)]"
            />
            <div className="relative">
              <p className="eyebrow">Not sure where you fit?</p>
              <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Join first. Pick a team once you have met everyone.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                The form lets you choose “Not sure yet”. We would love to hear from you either way.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <PrimaryCta to="/join">Join the chapter</PrimaryCta>
                <GhostCta to="/events" icon={false}>
                  See what we are planning
                  <ArrowUpRight className="h-4 w-4" />
                </GhostCta>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
