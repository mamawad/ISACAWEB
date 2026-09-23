import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MiniUser,
  PmActivity,
  PmComment,
  PmFile,
  PmProject,
  PmTask,
  PmUser,
  ProjectAccess,
} from "./permissions";
import { taskKey } from "./permissions";

/**
 * Service-role client for the pm_* tables. The generated Database type does
 * not know these tables, so the client is used untyped here and rows are
 * mapped into the shapes in permissions.ts before leaving the server.
 */
export async function pmDb(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export const MINI_USER_COLS = "id, username, display_name, avatar_color";
export const USER_COLS =
  "id, username, display_name, email, role_id, is_admin, is_active, must_change_password, avatar_color, last_login_at, created_at, role:pm_roles(id, name, permissions)";
export const TASK_COLS = `*, assignee:pm_users!pm_tasks_assignee_id_fkey(${MINI_USER_COLS}), reporter:pm_users!pm_tasks_reporter_id_fkey(${MINI_USER_COLS}), parent:parent_id(id, number, title), project:pm_projects(key)`;

export function mapMini(row: Row | null | undefined): MiniUser | null {
  if (!row) return null;
  return {
    id: row["id"],
    username: row["username"],
    display_name: row["display_name"],
    avatar_color: row["avatar_color"] ?? "#7c3aed",
  };
}

export function mapUser(row: Row): PmUser {
  return {
    id: row["id"],
    username: row["username"],
    display_name: row["display_name"],
    avatar_color: row["avatar_color"] ?? "#7c3aed",
    email: row["email"] ?? null,
    role_id: row["role_id"] ?? null,
    role_name: row["role"]?.["name"] ?? null,
    is_admin: !!row["is_admin"],
    is_active: row["is_active"] !== false,
    must_change_password: !!row["must_change_password"],
    last_login_at: row["last_login_at"] ?? null,
    created_at: row["created_at"],
  };
}

export function rolePermissions(row: Row): string[] {
  if (row["is_admin"]) return ["*"];
  const perms = row["role"]?.["permissions"];
  return Array.isArray(perms) ? perms.map(String) : [];
}

export function mapTask(row: Row): PmTask {
  const projectKey: string = row["project"]?.["key"] ?? row["project_key"] ?? "";
  const parent = row["parent"];
  return {
    id: row["id"],
    project_id: row["project_id"],
    project_key: projectKey,
    number: row["number"],
    key: taskKey(projectKey, row["number"]),
    type: row["type"],
    title: row["title"],
    description: row["description"] ?? null,
    status: row["status"],
    priority: row["priority"],
    assignee_id: row["assignee_id"] ?? null,
    reporter_id: row["reporter_id"] ?? null,
    parent_id: row["parent_id"] ?? null,
    labels: Array.isArray(row["labels"]) ? row["labels"].map(String) : [],
    start_date: row["start_date"] ?? null,
    due_date: row["due_date"] ?? null,
    estimate_hours: row["estimate_hours"] === null ? null : Number(row["estimate_hours"]),
    position: Number(row["position"] ?? 0),
    created_at: row["created_at"],
    updated_at: row["updated_at"],
    completed_at: row["completed_at"] ?? null,
    assignee: mapMini(row["assignee"]),
    reporter: mapMini(row["reporter"]),
    parent: parent
      ? { id: parent["id"], key: taskKey(projectKey, parent["number"]), title: parent["title"] }
      : null,
  };
}

export function mapProject(
  row: Row,
  extra: {
    member_count?: number;
    open_tasks?: number;
    done_tasks?: number;
    my_access?: ProjectAccess | null;
  } = {},
): PmProject {
  return {
    id: row["id"],
    key: row["key"],
    name: row["name"],
    description: row["description"] ?? null,
    color: row["color"] ?? "#7c3aed",
    lead_id: row["lead_id"] ?? null,
    lead: mapMini(row["lead"]),
    is_archived: !!row["is_archived"],
    created_at: row["created_at"],
    updated_at: row["updated_at"],
    member_count: extra.member_count ?? 0,
    open_tasks: extra.open_tasks ?? 0,
    done_tasks: extra.done_tasks ?? 0,
    my_access: extra.my_access ?? null,
  };
}

export function mapComment(row: Row): PmComment {
  return {
    id: row["id"],
    task_id: row["task_id"],
    user_id: row["user_id"] ?? null,
    body: row["body"],
    created_at: row["created_at"],
    user: mapMini(row["user"]),
  };
}

export function mapActivity(row: Row): PmActivity {
  const task = row["task"];
  const projectKey: string | null = row["project"]?.["key"] ?? null;
  return {
    id: row["id"],
    project_id: row["project_id"] ?? null,
    task_id: row["task_id"] ?? null,
    user_id: row["user_id"] ?? null,
    action: row["action"],
    meta: row["meta"] ?? {},
    created_at: row["created_at"],
    user: mapMini(row["user"]),
    task:
      task && projectKey
        ? { id: task["id"], key: taskKey(projectKey, task["number"]), title: task["title"] }
        : null,
    project_key: projectKey,
  };
}

export function mapFile(row: Row): PmFile {
  return {
    id: row["id"],
    project_id: row["project_id"],
    task_id: row["task_id"] ?? null,
    kind: row["kind"] === "link" ? "link" : "file",
    name: row["name"],
    storage_path: row["storage_path"] ?? null,
    url: row["url"] ?? null,
    size: row["size"] === null || row["size"] === undefined ? null : Number(row["size"]),
    mime: row["mime"] ?? null,
    uploaded_by: row["uploaded_by"] ?? null,
    created_at: row["created_at"],
    uploader: mapMini(row["uploader"]),
  };
}

/** Append to the activity log. Never throws — the log must not break the action. */
export async function logActivity(
  db: SupabaseClient,
  entry: {
    project_id?: string | null;
    task_id?: string | null;
    user_id: string | null;
    action: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await db.from("pm_activity").insert({
      project_id: entry.project_id ?? null,
      task_id: entry.task_id ?? null,
      user_id: entry.user_id,
      action: entry.action,
      meta: entry.meta ?? {},
    });
  } catch (err) {
    console.error("[manage] activity log failed:", err);
  }
}

export function fail(message: string): never {
  throw new Error(message);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}
