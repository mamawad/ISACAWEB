import { useSession } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ManageContext, Permission, ProjectAccess, ProjectRights } from "./permissions";
import { hasPermission, projectRights } from "./permissions";
import { USER_COLS, fail, mapMini, mapUser, pmDb, rolePermissions, type Row } from "./db.server";

export type ManageSession = {
  userId?: string;
  impersonatorId?: string | undefined;
  remember?: boolean | undefined;
};

const DAY = 60 * 60 * 24;

function sessionConfig(remember = false) {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("SESSION_SECRET is not set.");
  return {
    password,
    name: "chapter-manage",
    maxAge: remember ? DAY * 30 : DAY,
    cookie: {
      httpOnly: true,
      secure: true,
      // "none" so the cookie survives the Lovable preview iframe.
      sameSite: "none" as const,
      path: "/",
    },
  };
}

export async function getManageSession(remember?: boolean) {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- h3 session helper, not a React hook
  return useSession<ManageSession>(sessionConfig(remember));
}

export async function fetchUserRow(db: SupabaseClient, id: string): Promise<Row | null> {
  const { data } = await db.from("pm_users").select(USER_COLS).eq("id", id).maybeSingle();
  return (data as Row | null) ?? null;
}

/**
 * Resolve the signed-in user (or the member being impersonated) and their
 * effective permissions. Returns null when there is no valid session.
 */
export async function loadContext(): Promise<ManageContext | null> {
  const session = await getManageSession();
  const userId = session.data.userId;
  if (!userId) return null;

  const db = await pmDb();
  const row = await fetchUserRow(db, userId);
  if (!row || row["is_active"] === false) return null;

  let impersonator = null;
  const impId = session.data.impersonatorId;
  if (impId) {
    const impRow = await fetchUserRow(db, impId);
    if (impRow && impRow["is_admin"] === true && impRow["is_active"] !== false) {
      impersonator = mapMini(impRow);
    } else {
      // Stale impersonation — drop it rather than trust it.
      await session.update({ userId: impId, impersonatorId: undefined });
      return null;
    }
  }

  return { user: mapUser(row), permissions: rolePermissions(row), impersonator };
}

export async function requireContext(): Promise<ManageContext> {
  const ctx = await loadContext();
  if (!ctx) fail("Please sign in again.");
  return ctx;
}

export async function requirePermission(perm: Permission): Promise<ManageContext> {
  const ctx = await requireContext();
  if (!hasPermission(ctx, perm)) fail("You do not have permission to do that.");
  return ctx;
}

/** Membership access level of the current user in a project, if any. */
export async function memberAccess(
  db: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<ProjectAccess | null> {
  const { data } = await db
    .from("pm_project_members")
    .select("access")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  return ((data as Row | null)?.["access"] as ProjectAccess | undefined) ?? null;
}

export async function rightsFor(
  db: SupabaseClient,
  ctx: ManageContext,
  projectId: string,
): Promise<ProjectRights> {
  const access = await memberAccess(db, projectId, ctx.user.id);
  return projectRights(ctx, access);
}

export async function requireProjectView(
  db: SupabaseClient,
  ctx: ManageContext,
  projectId: string,
): Promise<ProjectRights> {
  const rights = await rightsFor(db, ctx, projectId);
  if (!rights.canView) fail("You do not have access to this project.");
  return rights;
}
