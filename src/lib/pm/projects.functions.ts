import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PmMember, PmProject, ProjectAccess, ProjectRights } from "./permissions";
import { hasPermission } from "./permissions";

const KEY = /^[A-Z][A-Z0-9]{1,5}$/;
const COLOR = /^#[0-9a-f]{6}$/i;
const ACCESS = z.enum(["lead", "editor", "member", "viewer"]);

const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name.").max(80),
  key: z.string().trim().toUpperCase().regex(KEY, "Key: 2–6 capital letters or digits, e.g. PR."),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  color: z.string().regex(COLOR).optional(),
  lead_id: z.string().uuid().nullable().optional(),
});

const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  color: z.string().regex(COLOR).optional(),
  lead_id: z.string().uuid().nullable().optional(),
  is_archived: z.boolean().optional(),
});

const memberSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  access: ACCESS.nullable(),
});

type Db = Awaited<ReturnType<(typeof import("./db.server"))["pmDb"]>>;

async function projectStats(db: Db, projectIds: string[]) {
  const members = new Map<string, number>();
  const open = new Map<string, number>();
  const done = new Map<string, number>();
  if (projectIds.length === 0) return { members, open, done };
  const [{ data: m }, { data: t }] = await Promise.all([
    db.from("pm_project_members").select("project_id").in("project_id", projectIds),
    db.from("pm_tasks").select("project_id, status").in("project_id", projectIds),
  ]);
  for (const row of (m ?? []) as { project_id: string }[]) {
    members.set(row.project_id, (members.get(row.project_id) ?? 0) + 1);
  }
  for (const row of (t ?? []) as { project_id: string; status: string }[]) {
    const bucket = row.status === "done" ? done : open;
    bucket.set(row.project_id, (bucket.get(row.project_id) ?? 0) + 1);
  }
  return { members, open, done };
}

/** Projects the current user can see, with counts and their access level. */
export const listProjects = createServerFn({ method: "GET" })
  .inputValidator((data: { archived?: boolean } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    const { requireContext } = await import("./session.server");
    const { pmDb, mapProject, MINI_USER_COLS } = await import("./db.server");
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

    let query = db
      .from("pm_projects")
      .select(`*, lead:pm_users!pm_projects_lead_id_fkey(${MINI_USER_COLS})`)
      .eq("is_archived", data.archived === true)
      .order("name");
    if (!hasPermission(ctx, "projects.view_all")) {
      const ids = [...myAccess.keys()];
      if (ids.length === 0)
        return { projects: [] as PmProject[], canCreate: hasPermission(ctx, "projects.create") };
      query = query.in("id", ids);
    }
    const { data: rows } = await query;
    const list = (rows ?? []) as Record<string, unknown>[];
    const stats = await projectStats(
      db,
      list.map((r) => r["id"] as string),
    );
    const projects = list.map((r) =>
      mapProject(r, {
        member_count: stats.members.get(r["id"] as string) ?? 0,
        open_tasks: stats.open.get(r["id"] as string) ?? 0,
        done_tasks: stats.done.get(r["id"] as string) ?? 0,
        my_access: myAccess.get(r["id"] as string) ?? null,
      }),
    );
    return { projects, canCreate: hasPermission(ctx, "projects.create") };
  });

/** One project by key, with members and the caller's rights. */
export const getProject = createServerFn({ method: "GET" })
  .inputValidator((data: { key: string }) => ({ key: String(data.key).toUpperCase() }))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, mapProject, MINI_USER_COLS } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();

    const { data: row } = await db
      .from("pm_projects")
      .select(`*, lead:pm_users!pm_projects_lead_id_fkey(${MINI_USER_COLS})`)
      .eq("key", data.key)
      .maybeSingle();
    if (!row) fail("Project not found.");
    const rights = await rightsFor(db, ctx, row["id"] as string);
    if (!rights.canView) fail("You do not have access to this project.");

    const { data: memberRows } = await db
      .from("pm_project_members")
      .select(
        `user_id, access, added_at, user:pm_users(${MINI_USER_COLS}, is_active, role:pm_roles(name))`,
      )
      .eq("project_id", row["id"] as string)
      .order("added_at");
    const members: PmMember[] = ((memberRows ?? []) as Record<string, unknown>[]).map((m) => {
      const u = m["user"] as Record<string, unknown>;
      return {
        user_id: m["user_id"] as string,
        access: m["access"] as ProjectAccess,
        added_at: m["added_at"] as string,
        user: {
          id: u["id"] as string,
          username: u["username"] as string,
          display_name: u["display_name"] as string,
          avatar_color: (u["avatar_color"] as string) ?? "#7c3aed",
          is_active: u["is_active"] !== false,
          role_name: ((u["role"] as Record<string, unknown> | null)?.["name"] as string) ?? null,
        },
      };
    });

    const stats = await projectStats(db, [row["id"] as string]);
    const project = mapProject(row, {
      member_count: members.length,
      open_tasks: stats.open.get(row["id"] as string) ?? 0,
      done_tasks: stats.done.get(row["id"] as string) ?? 0,
      my_access: rights.access,
    });
    return { project, members, rights: rights satisfies ProjectRights };
  });

export const createProject = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requirePermission("projects.create");
    const db = await pmDb();

    const { data: clash } = await db
      .from("pm_projects")
      .select("id")
      .eq("key", data.key)
      .maybeSingle();
    if (clash) fail("That project key is already in use.");

    const leadId = data.lead_id ?? ctx.user.id;
    const { data: row, error } = await db
      .from("pm_projects")
      .insert({
        key: data.key,
        name: data.name,
        description: data.description ? data.description : null,
        color: data.color ?? "#7c3aed",
        lead_id: leadId,
        created_by: ctx.user.id,
      })
      .select("id, key")
      .single();
    if (error || !row) fail(error?.message ?? "Could not create the project.");

    const members = new Map<string, ProjectAccess>([[leadId, "lead"]]);
    if (!members.has(ctx.user.id)) members.set(ctx.user.id, "lead");
    await db
      .from("pm_project_members")
      .insert(
        [...members].map(([user_id, access]) => ({ project_id: row["id"], user_id, access })),
      );
    await logActivity(db, {
      project_id: row["id"] as string,
      user_id: ctx.user.id,
      action: "project.created",
      meta: { name: data.name, key: data.key },
    });
    return { ok: true as const, key: row["key"] as string };
  });

export const updateProject = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const rights = await rightsFor(db, ctx, data.id);
    if (!rights.canManage) fail("You cannot change this project's settings.");

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) patch["name"] = data.name;
    if (data.description !== undefined)
      patch["description"] = data.description ? data.description : null;
    if (data.color !== undefined) patch["color"] = data.color;
    if (data.lead_id !== undefined) patch["lead_id"] = data.lead_id;
    if (data.is_archived !== undefined) patch["is_archived"] = data.is_archived;

    const { error } = await db.from("pm_projects").update(patch).eq("id", data.id);
    if (error) fail(error.message);
    if (data.lead_id) {
      await db
        .from("pm_project_members")
        .upsert(
          { project_id: data.id, user_id: data.lead_id, access: "lead" },
          { onConflict: "project_id,user_id" },
        );
    }
    await logActivity(db, {
      project_id: data.id,
      user_id: ctx.user.id,
      action:
        data.is_archived === true
          ? "project.archived"
          : data.is_archived === false
            ? "project.restored"
            : "project.updated",
      meta: { fields: Object.keys(patch).filter((k) => k !== "updated_at") },
    });
    return { ok: true as const };
  });

/** Add, change or remove (access = null) a project member. */
export const setProjectMember = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => memberSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const rights = await rightsFor(db, ctx, data.project_id);
    if (!rights.canManage) fail("You cannot manage members of this project.");

    const { data: target } = await db
      .from("pm_users")
      .select("display_name")
      .eq("id", data.user_id)
      .maybeSingle();
    if (!target) fail("Member not found.");

    if (data.access === null) {
      await db
        .from("pm_project_members")
        .delete()
        .eq("project_id", data.project_id)
        .eq("user_id", data.user_id);
    } else {
      await db
        .from("pm_project_members")
        .upsert(
          { project_id: data.project_id, user_id: data.user_id, access: data.access },
          { onConflict: "project_id,user_id" },
        );
    }
    await logActivity(db, {
      project_id: data.project_id,
      user_id: ctx.user.id,
      action: data.access === null ? "project.member_removed" : "project.member_set",
      meta: { target: target["display_name"], access: data.access },
    });
    return { ok: true as const };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requireContext } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requireContext();
    if (!ctx.user.is_admin) fail("Only administrators can delete a project. Archive it instead.");
    const db = await pmDb();
    const { data: row } = await db
      .from("pm_projects")
      .select("name, key")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) fail("Project not found.");
    // Drive objects are removed by the files module on demand; delete rows first.
    const { data: files } = await db
      .from("pm_files")
      .select("storage_path")
      .eq("project_id", data.id)
      .eq("kind", "file");
    const paths = ((files ?? []) as { storage_path: string | null }[])
      .map((f) => f.storage_path)
      .filter((p): p is string => !!p);
    if (paths.length) await db.storage.from("pm-drive").remove(paths);
    await db.from("pm_projects").delete().eq("id", data.id);
    await logActivity(db, {
      user_id: ctx.user.id,
      action: "project.deleted",
      meta: { name: row["name"], key: row["key"] },
    });
    return { ok: true as const };
  });

function fail(message: string): never {
  throw new Error(message);
}

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
