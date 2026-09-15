import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCheck,
  CheckSquare2,
  FolderKanban,
  Inbox,
} from "lucide-react";
import { getDashboard } from "@/lib/pm/dashboard.functions";
import { describeActivity } from "@/lib/pm/activity-text";
import { STATUSES, statusMeta } from "@/lib/pm/permissions";
import { useManage } from "@/components/manage/manage-context";
import { EmptyState, PageHeader } from "@/components/manage/shell";
import { StatTile } from "@/components/manage/stat-tile";
import { Avatar, AvatarStack } from "@/components/manage/avatar";
import { PriorityIcon, StatusBadge, TypeIcon } from "@/components/manage/badges";
import { formatDate, timeAgo } from "@/components/manage/fields";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/manage/")({
  head: () => ({ meta: [{ title: "Dashboard · ISACA Alfaisal workspace" }] }),
  component: Dashboard,
});

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const ctx = useManage();
  const { data, isLoading } = useQuery({
    queryKey: ["pm", "dashboard"],
    queryFn: () => getDashboard(),
  });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={
          <>
            {greeting()},{" "}
            <span className="text-gradient">{ctx.user.display_name.split(" ")[0]}</span>
          </>
        }
        description="Here is where the chapter stands today."
      />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Open tasks"
              value={data.stats.open}
              icon={Inbox}
              tone="violet"
              hint={`across ${data.stats.projects} project${data.stats.projects === 1 ? "" : "s"}`}
            />
            <StatTile
              label="Assigned to you"
              value={data.stats.mine}
              icon={CheckSquare2}
              tone="sky"
            />
            <StatTile
              label="Overdue"
              value={data.stats.overdue}
              icon={AlertTriangle}
              tone="coral"
              hint={data.stats.overdue ? "needs attention" : "all on track"}
            />
            <StatTile
              label="Done this week"
              value={data.stats.doneThisWeek}
              icon={CheckCheck}
              tone="lime"
            />
          </div>

          {/* Status distribution */}
          <div className="card-glow mt-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Work by status</p>
              <p className="text-xs text-muted-foreground">
                {data.stats.open + (data.stats.byStatus["done"] ?? 0)} tasks total
              </p>
            </div>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted">
              {STATUSES.map((s) => {
                const n = data.stats.byStatus[s.key] ?? 0;
                const total = Object.values(data.stats.byStatus).reduce((a, b) => a + b, 0) || 1;
                return (
                  <motion.span
                    key={s.key}
                    initial={{ width: 0 }}
                    animate={{ width: `${(n / total) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ backgroundColor: s.hue }}
                    title={`${s.label}: ${n}`}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
              {STATUSES.map((s) => (
                <span
                  key={s.key}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.hue }} />
                  {s.label} <span className="font-mono">{data.stats.byStatus[s.key] ?? 0}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-6">
              {/* My tasks */}
              <section className="card-glow overflow-hidden">
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                  <h2 className="font-display text-base font-semibold">Your open tasks</h2>
                  <Link
                    to="/manage/tasks"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    All my work <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {data.myTasks.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Nothing assigned to you. Enjoy the calm.
                  </p>
                ) : (
                  <ul className="divide-y divide-black/5">
                    {data.myTasks.map((t, i) => (
                      <motion.li
                        key={t.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Link
                          to="/manage/projects/$key"
                          params={{ key: t.project_key }}
                          search={{ task: t.id }}
                          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-black/[0.03]"
                        >
                          <TypeIcon type={t.type} />
                          <span className="font-mono text-xs text-muted-foreground">{t.key}</span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {t.title}
                          </span>
                          <PriorityIcon priority={t.priority} />
                          <StatusBadge status={t.status} className="hidden sm:inline-flex" />
                          {t.due_date ? (
                            <span
                              className={
                                t.due_date < today
                                  ? "text-xs font-semibold text-destructive"
                                  : "text-xs text-muted-foreground"
                              }
                            >
                              {formatDate(t.due_date)}
                            </span>
                          ) : null}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Projects */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold">Projects</h2>
                  <Link
                    to="/manage/projects"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    All projects <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {data.projects.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title="No projects yet"
                    description="Create the first project to start distributing work."
                    action={
                      <Link
                        to="/manage/projects"
                        search={{ create: true }}
                        className="btn btn-primary btn-sm"
                      >
                        <span className="relative">Create a project</span>
                      </Link>
                    }
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.projects.slice(0, 6).map((p) => {
                      const total = p.open_tasks + p.done_tasks;
                      const pct = total ? Math.round((p.done_tasks / total) * 100) : 0;
                      return (
                        <Link
                          key={p.id}
                          to="/manage/projects/$key"
                          params={{ key: p.key }}
                          className="card-glow group p-4 transition-transform hover:-translate-y-0.5"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="grid h-9 w-9 place-items-center rounded-xl font-mono text-xs font-bold text-white"
                              style={{ backgroundColor: p.color }}
                            >
                              {p.key.slice(0, 3)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{p.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {p.open_tasks} open · {p.member_count} member
                                {p.member_count === 1 ? "" : "s"}
                              </span>
                            </span>
                            <Avatar user={p.lead} size="sm" />
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <motion.span
                                className="block h-full rounded-full"
                                style={{ backgroundColor: p.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {pct}%
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <div className="flex flex-col gap-6">
              {/* Due soon */}
              <section className="card-glow overflow-hidden">
                <div className="flex items-center gap-2 border-b border-black/5 px-5 py-4">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-base font-semibold">Due in the next 7 days</h2>
                </div>
                {data.dueSoon.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Nothing due this week.
                  </p>
                ) : (
                  <ul className="divide-y divide-black/5">
                    {data.dueSoon.map((t) => (
                      <li key={t.id}>
                        <Link
                          to="/manage/projects/$key"
                          params={{ key: t.project_key }}
                          search={{ task: t.id }}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.03]"
                        >
                          <span
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-center font-mono text-[11px] leading-tight font-semibold"
                            style={{
                              color: statusMeta(t.status).hue,
                              backgroundColor: `color-mix(in oklab, ${statusMeta(t.status).hue} 12%, transparent)`,
                            }}
                          >
                            {formatDate(t.due_date)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{t.title}</span>
                            <span className="block font-mono text-[11px] text-muted-foreground">
                              {t.key}
                            </span>
                          </span>
                          <Avatar user={t.assignee} size="sm" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Activity */}
              <section className="card-glow overflow-hidden">
                <div className="flex items-center gap-2 border-b border-black/5 px-5 py-4">
                  <Activity className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-base font-semibold">Recent activity</h2>
                </div>
                {data.activity.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No activity yet.
                  </p>
                ) : (
                  <ul className="max-h-[32rem] divide-y divide-black/5 overflow-y-auto">
                    {data.activity.map((a) => (
                      <li key={a.id} className="flex gap-3 px-5 py-3">
                        <Avatar user={a.user} size="sm" />
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="leading-snug">
                            <span className="font-semibold">
                              {a.user?.display_name ?? "Someone"}
                            </span>{" "}
                            <span className="text-muted-foreground">{describeActivity(a)}</span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {a.project_key ? (
                              <span className="font-mono">{a.project_key} · </span>
                            ) : null}
                            {timeAgo(a.created_at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="card-glow flex items-center gap-3 p-4">
                <AvatarStack
                  users={data.projects
                    .flatMap((p) => (p.lead ? [p.lead] : []))
                    .filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i)}
                />
                <p className="text-xs text-muted-foreground">Project leads across the chapter.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
