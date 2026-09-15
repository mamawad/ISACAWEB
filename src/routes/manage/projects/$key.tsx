import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  CalendarRange,
  FolderOpen,
  KanbanSquare,
  List,
  Plus,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { getProject } from "@/lib/pm/projects.functions";
import { ProjectCtx, type ProjectData } from "@/components/manage/project-context";
import { AvatarStack } from "@/components/manage/avatar";
import { AccessBadge } from "@/components/manage/badges";
import { EmptyState } from "@/components/manage/shell";
import { TaskDrawer } from "@/components/manage/task-drawer";
import { CreateTaskDialog } from "@/components/manage/task-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProjectSearch = { task?: string };

export const Route = createFileRoute("/manage/projects/$key")({
  validateSearch: (search: Record<string, unknown>): ProjectSearch => {
    const task = search["task"];
    return typeof task === "string" && task ? { task } : {};
  },
  component: ProjectLayout,
});

const TABS: { to: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { to: "", label: "Board", icon: KanbanSquare, exact: true },
  { to: "/list", label: "List", icon: List },
  { to: "/timeline", label: "Timeline", icon: CalendarRange },
  { to: "/drive", label: "Drive", icon: FolderOpen },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

function ProjectLayout() {
  const { key } = Route.useParams();
  const { task } = Route.useSearch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [createPreset, setCreatePreset] = useState<{ status?: string; parent_id?: string } | null>(
    null,
  );

  const query = useQuery({
    queryKey: ["pm", "project", key.toUpperCase()],
    queryFn: () => getProject({ data: { key } }),
    retry: false,
  });

  const openTask = useCallback(
    (id: string) => navigate({ to: ".", search: (s) => ({ ...s, task: id }) }),
    [navigate],
  );
  const closeTask = useCallback(
    () =>
      navigate({
        to: ".",
        search: (s) => {
          const next = { ...s };
          delete next.task;
          return next;
        },
      }),
    [navigate],
  );
  const openCreate = useCallback((preset?: { status?: string; parent_id?: string }) => {
    setCreatePreset(preset ?? {});
  }, []);

  const value = useMemo<ProjectData | null>(() => {
    if (!query.data) return null;
    return {
      project: query.data.project,
      members: query.data.members,
      rights: query.data.rights,
      people: query.data.members.filter((m) => m.user.is_active).map((m) => m.user),
      refetch: query.refetch,
      openTask,
      openCreate,
    };
  }, [query.data, query.refetch, openTask, openCreate]);

  if (query.isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }
  if (query.isError || !value) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Project not found"
        description="It may have been deleted, or you do not have access to it."
        action={
          <Link to="/manage/projects" className="btn btn-ghost btn-sm">
            Back to projects
          </Link>
        }
      />
    );
  }

  const { project, members, rights } = value;
  const base = `/manage/projects/${project.key}`;

  return (
    <ProjectCtx.Provider value={value}>
      {/* Header */}
      <div className="card-glow relative mb-5 overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: project.color }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: project.color }}
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-mono text-sm font-bold text-white shadow-lg"
              style={{
                backgroundColor: project.color,
                boxShadow: `0 12px 30px -12px ${project.color}`,
              }}
            >
              {project.key.slice(0, 3)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                  {project.name}
                </h1>
                <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {project.key}
                </span>
                <AccessBadge access={rights.access} />
                {project.is_archived ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    Archived
                  </span>
                ) : null}
              </div>
              {project.description ? (
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                  {project.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AvatarStack users={members.map((m) => m.user)} max={5} />
            {rights.canCreate && !project.is_archived ? (
              <button type="button" onClick={() => openCreate()} className="btn btn-primary btn-sm">
                <Plus className="relative h-4 w-4" />
                <span className="relative">Create task</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <nav
          className="relative mt-5 -mb-2 flex gap-1 overflow-x-auto"
          aria-label="Project sections"
        >
          {TABS.map((tab) => {
            const href = `${base}${tab.to}`;
            const active = tab.exact
              ? pathname.replace(/\/$/, "") === base
              : pathname.startsWith(href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.label}
                to={href as "/manage/projects/$key"}
                params={{ key: project.key }}
                className={cn(
                  "relative flex items-center gap-2 rounded-t-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {active ? (
                  <motion.span
                    layoutId="project-tab"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />

      <TaskDrawer taskId={task ?? null} onClose={closeTask} />
      <CreateTaskDialog
        open={createPreset !== null}
        preset={createPreset ?? {}}
        onOpenChange={(o) => {
          if (!o) setCreatePreset(null);
        }}
      />
    </ProjectCtx.Provider>
  );
}
