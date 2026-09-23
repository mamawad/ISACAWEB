import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  List as ListIcon,
} from "lucide-react";
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

type Node = { task: PmTask; depth: number; children: Node[] };
type Row = { task: PmTask; depth: number; hasChildren: boolean; expanded: boolean };

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
  const [nested, setNested] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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

  /** Flat rows in hierarchy order: epic > story > task > bug. */
  const rows = useMemo<Row[]>(() => {
    if (!nested) {
      return sorted.map((t) => ({ task: t, depth: 0, hasChildren: false, expanded: false }));
    }
    const byId = new Map<string, Node>(
      sorted.map((t) => [t.id, { task: t, depth: 0, children: [] }]),
    );
    const roots: Node[] = [];
    for (const node of byId.values()) {
      const parentId = node.task.parent_id;
      const parent = parentId ? byId.get(parentId) : undefined;
      if (parent && parent !== node) parent.children.push(node);
      else roots.push(node);
    }
    const out: Row[] = [];
    const walk = (nodes: Node[], depth: number) => {
      for (const n of nodes) {
        const hasChildren = n.children.length > 0;
        const expanded = hasChildren && !collapsed.has(n.task.id);
        out.push({ task: n.task, depth, hasChildren, expanded });
        if (expanded) walk(n.children, depth + 1);
      }
    };
    walk(roots, 0);
    return out;
  }, [sorted, nested, collapsed]);

  // Drop collapse state for tasks that no longer exist.
  useEffect(() => {
    setCollapsed((prev) => {
      if (prev.size === 0) return prev;
      const ids = new Set(tasks.map((t) => t.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [tasks]);

  function toggleRow(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
        <div className="flex h-9 items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={nested}
              onChange={(e) => setNested(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Nested view
          </label>
          {nested ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCollapsed(new Set())}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-black/5 hover:text-foreground"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={() =>
                  setCollapsed(
                    new Set(
                      tasks.filter((t) => tasks.some((c) => c.parent_id === t.id)).map((t) => t.id),
                    ),
                  )
                }
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-black/5 hover:text-foreground"
              >
                Collapse all
              </button>
            </div>
          ) : null}
        </div>
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
              {rows.map(({ task: t, depth, hasChildren, expanded }) => {
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
                      <span
                        className="inline-flex items-start gap-1"
                        style={{ paddingLeft: depth * 18 }}
                      >
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleRow(t.id)}
                            aria-expanded={expanded}
                            aria-label={expanded ? `Collapse ${t.key}` : `Expand ${t.key}`}
                            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground hover:bg-black/5 hover:text-foreground"
                          >
                            {expanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="h-5 w-5 shrink-0" />
                        )}
                        <span>
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
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      {editable ? (
                        <SelectField
                          className="h-8 text-xs"
                          value={t.status}
                          onChange={(v) => setStatus.mutate({ id: t.id, status: v as TaskStatus })}
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
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
