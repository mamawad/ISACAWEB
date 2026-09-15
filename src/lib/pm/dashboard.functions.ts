import { createServerFn } from "@tanstack/react-start";
import type { PmActivity, PmProject, PmTask, ProjectAccess } from "./permissions";
import { hasPermission } from "./permissions";

/** Everything the dashboard needs in one round trip. */
export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { requireContext } = await import("./session.server");
  const { pmDb, mapProject, mapTask, mapActivity, TASK_COLS, MINI_USER_COLS } =
    await import("./db.server");
  const ctx = await requireContext();
  const db = await pmDb();

  const { data: memberships } = await db
    .from("pm_project_members")
    .select("project_id, access")
    .eq("user_id", ctx.user.id);
  const myAccess = new Map<string, ProjectAccess>();
  for (const m of (memberships ?? []) as { project_id: string; access: ProjectAccess }[]) {
    myAccess.set(m.project_id, m.access);
  }

  let projectQuery = db
    .from("pm_projects")
    .select(`*, lead:pm_users!pm_projects_lead_id_fkey(${MINI_USER_COLS})`)
    .eq("is_archived", false)
    .order("name");
  const viewAll = hasPermission(ctx, "projects.view_all");
  if (!viewAll) {
    const ids = [...myAccess.keys()];
    projectQuery = ids.length
      ? projectQuery.in("id", ids)
      : projectQuery.in("id", ["00000000-0000-0000-0000-000000000000"]);
  }
  const { data: projectRows } = await projectQuery;
  const projectIds = ((projectRows ?? []) as Record<string, unknown>[]).map(
    (r) => r["id"] as string,
  );

  const [{ data: taskRows }, { data: memberRows }, { data: activityRows }] = await Promise.all([
    projectIds.length
      ? db.from("pm_tasks").select(TASK_COLS).in("project_id", projectIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    projectIds.length
      ? db.from("pm_project_members").select("project_id").in("project_id", projectIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    projectIds.length
      ? db
          .from("pm_activity")
          .select(
            `*, user:pm_users(${MINI_USER_COLS}), task:pm_tasks(id, number, title), project:pm_projects(key)`,
          )
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(25)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const tasks = ((taskRows ?? []) as Record<string, unknown>[]).map(mapTask) as PmTask[];
  const memberCounts = new Map<string, number>();
  for (const m of (memberRows ?? []) as { project_id: string }[]) {
    memberCounts.set(m.project_id, (memberCounts.get(m.project_id) ?? 0) + 1);
  }
  const projects = ((projectRows ?? []) as Record<string, unknown>[]).map((r) => {
    const id = r["id"] as string;
    const mine = tasks.filter((t) => t.project_id === id);
    return mapProject(r, {
      member_count: memberCounts.get(id) ?? 0,
      open_tasks: mine.filter((t) => t.status !== "done").length,
      done_tasks: mine.filter((t) => t.status === "done").length,
      my_access: myAccess.get(id) ?? null,
    });
  }) as PmProject[];

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const inWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const open = tasks.filter((t) => t.status !== "done");
  const myOpen = open
    .filter((t) => t.assignee_id === ctx.user.id)
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));

  const byStatus: Record<string, number> = {};
  for (const t of tasks) byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;

  return {
    projects,
    myTasks: myOpen.slice(0, 12),
    dueSoon: open
      .filter((t) => t.due_date && t.due_date >= today && t.due_date <= inWeek)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
      .slice(0, 10),
    activity: ((activityRows ?? []) as Record<string, unknown>[]).map(mapActivity) as PmActivity[],
    stats: {
      projects: projects.length,
      open: open.length,
      overdue: open.filter((t) => t.due_date && t.due_date < today).length,
      doneThisWeek: tasks.filter((t) => t.status === "done" && (t.completed_at ?? "") >= weekAgo)
        .length,
      mine: myOpen.length,
      byStatus,
    },
  };
});
