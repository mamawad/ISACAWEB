import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PmActivity, PmComment, PmFile, PmTask, ProjectRights } from "./permissions";
import { canEditTask, hasPermission } from "./permissions";

const STATUS = z.enum(["backlog", "todo", "in_progress", "in_review", "done"]);
const PRIORITY = z.enum(["lowest", "low", "medium", "high", "highest"]);
const TYPE = z.enum(["epic", "story", "task", "bug"]);
const DATE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .nullable();

const taskFields = {
  title: z.string().trim().min(1, "Give the task a title.").max(200),
  description: z.string().trim().max(10_000).optional().or(z.literal("")),
  type: TYPE.optional(),
  status: STATUS.optional(),
  priority: PRIORITY.optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  labels: z.array(z.string().trim().min(1).max(30)).max(12).optional(),
  start_date: DATE.optional(),
  due_date: DATE.optional(),
  estimate_hours: z.number().min(0).max(10_000).nullable().optional(),
};

const createTaskSchema = z.object({ project_id: z.string().uuid(), ...taskFields });
const updateTaskSchema = z.object({
  id: z.string().uuid(),
  ...taskFields,
  title: taskFields.title.optional(),
});
const moveTaskSchema = z.object({
  id: z.string().uuid(),
  status: STATUS,
  /** Ids of tasks in the destination column, in their new order (including this one). */
  order: z.array(z.string().uuid()).max(500),
});

type Db = Awaited<ReturnType<(typeof import("./db.server"))["pmDb"]>>;

async function loadTask(db: Db, id: string) {
  const { TASK_COLS, mapTask } = await import("./db.server");
  const { data } = await db.from("pm_tasks").select(TASK_COLS).eq("id", id).maybeSingle();
  return data ? mapTask(data as Record<string, unknown>) : null;
}

/** All tasks in a project (any status). */
export const listProjectTasks = createServerFn({ method: "GET" })
  .inputValidator((data: { project_id: string }) =>
    z.object({ project_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requireContext, requireProjectView } = await import("./session.server");
    const { pmDb, TASK_COLS, mapTask } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const rights = await requireProjectView(db, ctx, data.project_id);
    const { data: rows, error } = await db
      .from("pm_tasks")
      .select(TASK_COLS)
      .eq("project_id", data.project_id)
      .order("position")
      .order("created_at");
    if (error) fail(error.message);
    const tasks = ((rows ?? []) as Record<string, unknown>[]).map(mapTask) as PmTask[];
    return { tasks, rights: rights satisfies ProjectRights };
  });

/** Tasks assigned to or reported by the current user, across projects. */
export const listMyTasks = createServerFn({ method: "GET" }).handler(async () => {
  const { requireContext } = await import("./session.server");
  const { pmDb, TASK_COLS, mapTask } = await import("./db.server");
  const ctx = await requireContext();
  const db = await pmDb();
  const { data: rows } = await db
    .from("pm_tasks")
    .select(TASK_COLS)
    .or(`assignee_id.eq.${ctx.user.id},reporter_id.eq.${ctx.user.id}`)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });
  return { tasks: ((rows ?? []) as Record<string, unknown>[]).map(mapTask) as PmTask[] };
});

/** Full task: comments, activity, files, subtasks. */
export const getTask = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requireContext, requireProjectView } = await import("./session.server");
    const { pmDb, TASK_COLS, mapTask, mapComment, mapActivity, mapFile, MINI_USER_COLS } =
      await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const task = await loadTask(db, data.id);
    if (!task) fail("Task not found.");
    const rights = await requireProjectView(db, ctx, task.project_id);

    const [{ data: comments }, { data: activity }, { data: files }, { data: subtasks }] =
      await Promise.all([
        db
          .from("pm_comments")
          .select(`*, user:pm_users(${MINI_USER_COLS})`)
          .eq("task_id", task.id)
          .order("created_at"),
        db
          .from("pm_activity")
          .select(
            `*, user:pm_users(${MINI_USER_COLS}), task:pm_tasks(id, number, title), project:pm_projects(key)`,
          )
          .eq("task_id", task.id)
          .order("created_at", { ascending: false })
          .limit(50),
        db
          .from("pm_files")
          .select(`*, uploader:pm_users(${MINI_USER_COLS})`)
          .eq("task_id", task.id)
          .order("created_at", { ascending: false }),
        db.from("pm_tasks").select(TASK_COLS).eq("parent_id", task.id).order("position"),
      ]);

    return {
      task,
      rights,
      canEdit: canEditTask(ctx, rights, task),
      canDelete: rights.canManage || hasPermission(ctx, "tasks.delete"),
      comments: ((comments ?? []) as Record<string, unknown>[]).map(mapComment) as PmComment[],
      activity: ((activity ?? []) as Record<string, unknown>[]).map(mapActivity) as PmActivity[],
      files: ((files ?? []) as Record<string, unknown>[]).map(mapFile) as PmFile[],
      subtasks: ((subtasks ?? []) as Record<string, unknown>[]).map(mapTask) as PmTask[],
    };
  });

export const createTask = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createTaskSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const rights = await rightsFor(db, ctx, data.project_id);
    if (!rights.canCreate) fail("You cannot create tasks in this project.");

    // Claim the next task number with an optimistic counter bump.
    let number = 0;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data: p } = await db
        .from("pm_projects")
        .select("task_counter")
        .eq("id", data.project_id)
        .single();
      const current = Number(p?.["task_counter"] ?? 0);
      const { data: bumped } = await db
        .from("pm_projects")
        .update({ task_counter: current + 1 })
        .eq("id", data.project_id)
        .eq("task_counter", current)
        .select("task_counter");
      if (bumped && bumped.length > 0) {
        number = current + 1;
        break;
      }
    }
    if (!number) fail("Could not allocate a task number. Please retry.");

    const status = data.status ?? "todo";
    const { data: last } = await db
      .from("pm_tasks")
      .select("position")
      .eq("project_id", data.project_id)
      .eq("status", status)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const position = Number(last?.["position"] ?? 0) + 1000;

    const { data: row, error } = await db
      .from("pm_tasks")
      .insert({
        project_id: data.project_id,
        number,
        type: data.type ?? "task",
        title: data.title,
        description: data.description ? data.description : null,
        status,
        priority: data.priority ?? "medium",
        assignee_id: data.assignee_id ?? null,
        reporter_id: ctx.user.id,
        parent_id: data.parent_id ?? null,
        labels: data.labels ?? [],
        start_date: data.start_date ?? null,
        due_date: data.due_date ?? null,
        estimate_hours: data.estimate_hours ?? null,
        position,
        completed_at: status === "done" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !row) fail(error?.message ?? "Could not create the task.");
    const task = await loadTask(db, row["id"] as string);
    await logActivity(db, {
      project_id: data.project_id,
      task_id: row["id"] as string,
      user_id: ctx.user.id,
      action: "task.created",
      meta: { title: data.title },
    });
    return { ok: true as const, task: task! };
  });

export const updateTask = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateTaskSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const before = await loadTask(db, data.id);
    if (!before) fail("Task not found.");
    const rights = await rightsFor(db, ctx, before.project_id);
    if (!canEditTask(ctx, rights, before)) fail("You cannot edit this task.");
    if (data.parent_id === data.id) fail("A task cannot be its own parent.");

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const changes: { field: string; from: unknown; to: unknown }[] = [];
    const set = (field: string, value: unknown, previous: unknown) => {
      if (value === undefined) return;
      if (JSON.stringify(value) === JSON.stringify(previous)) return;
      patch[field] = value;
      changes.push({ field, from: previous, to: value });
    };
    set("title", data.title, before.title);
    set(
      "description",
      data.description === undefined ? undefined : data.description || null,
      before.description,
    );
    set("type", data.type, before.type);
    set("status", data.status, before.status);
    set("priority", data.priority, before.priority);
    set("assignee_id", data.assignee_id, before.assignee_id);
    set("parent_id", data.parent_id, before.parent_id);
    set("labels", data.labels, before.labels);
    set("start_date", data.start_date, before.start_date);
    set("due_date", data.due_date, before.due_date);
    set("estimate_hours", data.estimate_hours, before.estimate_hours);
    if (data.status !== undefined && data.status !== before.status) {
      patch["completed_at"] = data.status === "done" ? new Date().toISOString() : null;
    }

    if (changes.length > 0) {
      const { error } = await db.from("pm_tasks").update(patch).eq("id", data.id);
      if (error) fail(error.message);
      for (const c of changes) {
        await logActivity(db, {
          project_id: before.project_id,
          task_id: data.id,
          user_id: ctx.user.id,
          action: `task.${c.field}`,
          meta: { from: c.from, to: c.to },
        });
      }
    }
    const task = await loadTask(db, data.id);
    return { ok: true as const, task: task! };
  });

/** Board drag: set status and rewrite positions for the destination column. */
export const moveTask = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => moveTaskSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const before = await loadTask(db, data.id);
    if (!before) fail("Task not found.");
    const rights = await rightsFor(db, ctx, before.project_id);
    if (!canEditTask(ctx, rights, before)) fail("You cannot move this task.");

    const now = new Date().toISOString();
    const statusChanged = before.status !== data.status;
    await db
      .from("pm_tasks")
      .update({
        status: data.status,
        updated_at: now,
        ...(statusChanged ? { completed_at: data.status === "done" ? now : null } : {}),
      })
      .eq("id", data.id);

    // Re-space the column so future inserts have room.
    const order = data.order.includes(data.id) ? data.order : [...data.order, data.id];
    await Promise.all(
      order.map((id, i) =>
        db
          .from("pm_tasks")
          .update({ position: (i + 1) * 1000 })
          .eq("id", id)
          .eq("project_id", before.project_id),
      ),
    );
    if (statusChanged) {
      await logActivity(db, {
        project_id: before.project_id,
        task_id: data.id,
        user_id: ctx.user.id,
        action: "task.status",
        meta: { from: before.status, to: data.status },
      });
    }
    return { ok: true as const };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const task = await loadTask(db, data.id);
    if (!task) fail("Task not found.");
    const rights = await rightsFor(db, ctx, task.project_id);
    if (!(rights.canManage || hasPermission(ctx, "tasks.delete")))
      fail("You cannot delete tasks here.");
    await db.from("pm_tasks").delete().eq("id", data.id);
    await logActivity(db, {
      project_id: task.project_id,
      user_id: ctx.user.id,
      action: "task.deleted",
      meta: { key: task.key, title: task.title },
    });
    return { ok: true as const };
  });

export const addComment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ task_id: z.string().uuid(), body: z.string().trim().min(1).max(5000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requireContext, requireProjectView } = await import("./session.server");
    const { pmDb, logActivity, mapComment, MINI_USER_COLS } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const task = await loadTask(db, data.task_id);
    if (!task) fail("Task not found.");
    const rights = await requireProjectView(db, ctx, task.project_id);
    if (rights.access === "viewer" && !rights.canEditAny) fail("Viewers cannot comment.");
    const { data: row, error } = await db
      .from("pm_comments")
      .insert({ task_id: data.task_id, user_id: ctx.user.id, body: data.body })
      .select(`*, user:pm_users(${MINI_USER_COLS})`)
      .single();
    if (error || !row) fail(error?.message ?? "Could not add the comment.");
    await logActivity(db, {
      project_id: task.project_id,
      task_id: task.id,
      user_id: ctx.user.id,
      action: "task.commented",
    });
    return { ok: true as const, comment: mapComment(row as Record<string, unknown>) };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const { data: row } = await db
      .from("pm_comments")
      .select("id, user_id, task:pm_tasks(project_id)")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) fail("Comment not found.");
    const projectId = (row["task"] as unknown as Record<string, unknown> | null)?.[
      "project_id"
    ] as string;
    const rights = await rightsFor(db, ctx, projectId);
    if (row["user_id"] !== ctx.user.id && !rights.canManage)
      fail("You cannot delete this comment.");
    await db.from("pm_comments").delete().eq("id", data.id);
    return { ok: true as const };
  });

function fail(message: string): never {
  throw new Error(message);
}

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
