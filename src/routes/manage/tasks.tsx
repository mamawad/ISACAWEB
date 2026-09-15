import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckSquare2 } from "lucide-react";
import { listMyTasks } from "@/lib/pm/tasks.functions";
import { STATUSES, type PmTask } from "@/lib/pm/permissions";
import { useManage } from "@/components/manage/manage-context";
import { EmptyState, PageHeader } from "@/components/manage/shell";
import { Avatar } from "@/components/manage/avatar";
import { PriorityIcon, StatusBadge, TypeIcon } from "@/components/manage/badges";
import { formatDate } from "@/components/manage/fields";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manage/tasks")({
  head: () => ({ meta: [{ title: "My work · ISACA Alfaisal workspace" }] }),
  component: MyWorkPage,
});

type Scope = "assigned" | "reported" | "all";

function MyWorkPage() {
  const ctx = useManage();
  const { data, isLoading } = useQuery({
    queryKey: ["pm", "my-tasks"],
    queryFn: () => listMyTasks(),
  });
  const [scope, setScope] = useState<Scope>("assigned");
  const [showDone, setShowDone] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const tasks = useMemo(() => {
    const all = data?.tasks ?? [];
    return all.filter((t) => {
      if (!showDone && t.status === "done") return false;
      if (scope === "assigned") return t.assignee_id === ctx.user.id;
      if (scope === "reported") return t.reporter_id === ctx.user.id;
      return true;
    });
  }, [data, scope, showDone, ctx.user.id]);

  const groups = useMemo(() => {
    const map = new Map<string, PmTask[]>();
    for (const t of tasks) {
      const list = map.get(t.project_key) ?? [];
      list.push(t);
      map.set(t.project_key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  const overdue = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "done",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="My work"
        title="Everything on your plate"
        description={
          overdue
            ? `${overdue} task${overdue === 1 ? " is" : "s are"} past due.`
            : "Nothing overdue. Nice."
        }
        actions={
          <>
            <div className="flex rounded-full bg-black/5 p-1">
              {(
                [
                  { key: "assigned", label: "Assigned to me" },
                  { key: "reported", label: "Reported by me" },
                  { key: "all", label: "Both" },
                ] as { key: Scope; label: string }[]
              ).map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setScope(s.key)}
                  className={cn(
                    "relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    scope === s.key ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {scope === s.key ? (
                    <motion.span
                      layoutId="mywork-scope"
                      className="absolute inset-0 rounded-full bg-white shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  ) : null}
                  <span className="relative">{s.label}</span>
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={showDone}
                onChange={(e) => setShowDone(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Show done
            </label>
          </>
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare2}
          title="Nothing here"
          description="Tasks assigned to you or reported by you will show up here, grouped by project."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([projectKey, list]) => (
            <section key={projectKey} className="card-glow overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                <Link
                  to="/manage/projects/$key"
                  params={{ key: projectKey }}
                  className="font-display text-sm font-semibold hover:text-primary"
                >
                  {projectKey}
                </Link>
                <div className="flex gap-1.5">
                  {STATUSES.map((s) => {
                    const n = list.filter((t) => t.status === s.key).length;
                    return n ? (
                      <span
                        key={s.key}
                        className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                        style={{
                          color: s.hue,
                          backgroundColor: `color-mix(in oklab, ${s.hue} 12%, transparent)`,
                        }}
                      >
                        {n}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <ul className="divide-y divide-black/5">
                {list.map((t) => {
                  const late = t.due_date && t.due_date < today && t.status !== "done";
                  return (
                    <li key={t.id}>
                      <Link
                        to="/manage/projects/$key"
                        params={{ key: t.project_key }}
                        search={{ task: t.id }}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03]"
                      >
                        <TypeIcon type={t.type} size="xs" />
                        <span className="font-mono text-xs text-muted-foreground">{t.key}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {t.title}
                        </span>
                        <PriorityIcon priority={t.priority} />
                        <StatusBadge status={t.status} className="hidden sm:inline-flex" />
                        {t.due_date ? (
                          <span
                            className={cn(
                              "text-xs",
                              late ? "font-semibold text-destructive" : "text-muted-foreground",
                            )}
                          >
                            {formatDate(t.due_date)}
                          </span>
                        ) : null}
                        <Avatar user={t.assignee} size="xs" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
