import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, List as ListIcon } from "lucide-react";
import { toast } from "sonner";
import { listProjectTasks, updateTask } from "@/lib/pm/tasks.functions";
import {
  PRIORITIES,
  STATUSES,
  canEditTask,
  type PmTask,
  type TaskStatus,
} from "@/lib/pm/permissions";
import { useManage } from "@/components/manage/manage-context";
import { useProject } from "@/components/manage/project-context";
import { FilterBar } from "@/components/manage/filter-bar";
import { useTaskFilter } from "@/components/manage/task-filters";
import { EmptyState } from "@/components/manage/shell";
import { Avatar } from "@/components/manage/avatar";
import { PriorityIcon, StatusBadge, TypeIcon } from "@/components/manage/badges";
import { SelectField, errorMessage, formatDate, timeAgo } from "@/components/manage/fields";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manage/projects/$key/list")({
  component: ListPage,
});

type SortKey = "key" | "title" | "status" | "priority" | "assignee" | "due_date" | "updated_at";

const STATUS_RANK = Object.fromEntries(STATUSES.map((s, i) => [s.key, i]));
const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((p) => [p.key, p.rank]));

function ListPage() {
  const ctx = useManage();
  const { project, people, rights, openTask, openCreate } = useProject();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["pm", "tasks", project.id],
    queryFn: () => listProjectTasks({ data: { project_id: project.id } }),
  });
  const tasks = query.data?.tasks ?? [];
  const { filter, setFilter, filtered, active, reset } = useTaskFilter(tasks, ctx.user.id);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "updated_at", dir: -1 });
  const [groupByEpic, setGroupByEpic] = useState(false);

  const sorted = useMemo(() => {
    const cmp = (a: PmTask, b: PmTask): number => {
      switch (sort.key) {
        case "key":
          return a.number - b.number;
        case "title":
          return a.title.localeCompare(b.title);
        case "status":
          return (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
        case "priority":
          return (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0);
        case "assignee":
          return (a.assignee?.display_name ?? "~").localeCompare(b.assignee?.display_name ?? "~");
        case "due_date":
          return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
        case "updated_at":
        default:
          return a.updated_at.localeCompare(b.updated_at);
      }
    };
    return [...filtered].sort((a, b) => cmp(a, b) * sort.dir);
  }, [filtered, sort]);

  const groups = useMemo(() => {
    if (!groupByEpic) return [{ label: null as string | null, tasks: sorted }];
    const epics = new Map<string, { label: string; tasks: PmTask[] }>();
    const none: PmTask[] = [];
    for (const t of sorted) {
      if (t.parent) {
        const g = epics.get(t.parent.id) ?? {
          label: `${t.parent.key} · ${t.parent.title}`,
          tasks: [],
        };
        g.tasks.push(t);
        epics.set(t.parent.id, g);
      } else none.push(t);
    }
    return [...epics.values(), { label: "No epic", tasks: none }].filter((g) => g.tasks.length);
  }, [sorted, groupByEpic]);

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: TaskStatus }) => updateTask({ data: v }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pm", "tasks", project.id] });
      void qc.invalidateQueries({ queryKey: ["pm", "project", project.key] });
      void qc.invalidateQueries({ queryKey: ["pm", "dashboard"] });
    },
    onError: (err) => toast.error("Could not update", { description: errorMessage(err) }),
  });

  function toggle(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }
  const Head = ({
    k,
    children,
    className,
  }: {
    k: SortKey;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={cn(
        "px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => toggle(k)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        {sort.key === k ? (
          sort.dir === 1 ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
  const today = new Date().toISOString().slice(0, 10);

  if (query.isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <FilterBar
          filter={filter}
          setFilter={setFilter}
          people={people}
          active={active}
          reset={reset}
          showStatus
        />
        <label className="flex h-9 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={groupByEpic}
            onChange={(e) => setGroupByEpic(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Group by epic
        </label>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListIcon}
          title="No tasks yet"
          action={
            rights.canCreate ? (
              <button type="button" onClick={() => openCreate()} className="btn btn-primary btn-sm">
                <span className="relative">Create task</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card-glow overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-black/8 bg-black/[0.02]">
              <tr>
                <Head k="key" className="w-24">
                  Key
                </Head>
                <Head k="title">Title</Head>
                <Head k="status" className="w-40">
                  Status
                </Head>
                <Head k="priority" className="w-28">
                  Priority
                </Head>
                <Head k="assignee" className="w-44">
                  Assignee
                </Head>
                <Head k="due_date" className="w-28">
                  Due
                </Head>
                <Head k="updated_at" className="w-28">
                  Updated
                </Head>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <GroupRows key={g.label ?? "__all"} label={g.label}>
                  {g.tasks.map((t) => {
                    const editable = canEditTask(ctx, rights, t) && !project.is_archived;
                    const overdue = t.due_date && t.due_date < today && t.status !== "done";
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-black/5 transition-colors hover:bg-black/[0.025]"
                      >
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => openTask(t.id)}
                            className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary"
                          >
                            <TypeIcon type={t.type} size="xs" />
                            {t.key}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => openTask(t.id)}
                            className="text-left font-medium hover:text-primary"
                          >
                            {t.title}
                          </button>
                          {t.labels.length ? (
                            <span className="ml-2 inline-flex gap-1">
                              {t.labels.slice(0, 3).map((l) => (
                                <span
                                  key={l}
                                  className="rounded bg-primary/10 px-1 text-[10px] font-semibold text-primary"
                                >
                                  {l}
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-1.5">
                          {editable ? (
                            <SelectField
                              className="h-8 text-xs"
                              value={t.status}
                              onChange={(v) =>
                                setStatus.mutate({ id: t.id, status: v as TaskStatus })
                              }
                              options={STATUSES.map((s) => ({ value: s.key, label: s.label }))}
                            />
                          ) : (
                            <StatusBadge status={t.status} />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <PriorityIcon priority={t.priority} withLabel />
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-2">
                            <Avatar user={t.assignee} size="xs" />
                            <span className="truncate text-xs">
                              {t.assignee?.display_name ?? "Unassigned"}
                            </span>
                          </span>
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-xs",
                            overdue ? "font-semibold text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {formatDate(t.due_date)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {timeAgo(t.updated_at)}
                        </td>
                      </tr>
                    );
                  })}
                </GroupRows>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function GroupRows({ label, children }: { label: string | null; children: React.ReactNode }) {
  return (
    <>
      {label ? (
        <tr className="bg-primary/5">
          <td colSpan={7} className="px-3 py-1.5 text-xs font-semibold text-primary">
            {label}
          </td>
        </tr>
      ) : null}
      {children}
    </>
  );
}
