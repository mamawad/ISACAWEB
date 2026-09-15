import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PERMISSIONS, type PmRole, type PmUser } from "./permissions";

const USERNAME = /^[a-z0-9._-]{3,32}$/i;
const COLOR = /^#[0-9a-f]{6}$/i;

const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(USERNAME, "3–32 letters, numbers, dots, dashes or underscores."),
  display_name: z.string().trim().min(2, "Enter a display name.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(255).optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role_id: z.string().uuid().nullable().optional(),
  is_admin: z.boolean().optional().default(false),
  must_change_password: z.boolean().optional().default(true),
  avatar_color: z.string().regex(COLOR).optional(),
});

const updateUserSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  role_id: z.string().uuid().nullable().optional(),
  is_admin: z.boolean().optional(),
  is_active: z.boolean().optional(),
  avatar_color: z.string().regex(COLOR).optional(),
});

const resetPasswordSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  must_change_password: z.boolean().optional().default(true),
});

const PERMISSION_KEYS = new Set<string>(PERMISSIONS.map((p) => p.key));

const saveRoleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Enter a role name.").max(60),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  permissions: z.array(z.string()).transform((list) => list.filter((p) => PERMISSION_KEYS.has(p))),
});

export const listPeople = createServerFn({ method: "GET" }).handler(async () => {
  const { requirePermission } = await import("./session.server");
  const { pmDb, mapUser, USER_COLS } = await import("./db.server");
  const ctx = await requirePermission("people.view");
  const db = await pmDb();
  const [{ data: users }, roles] = await Promise.all([
    db.from("pm_users").select(USER_COLS).order("display_name"),
    fetchRoles(db),
  ]);
  return {
    users: ((users ?? []) as Parameters<typeof mapUser>[0][]).map(mapUser) as PmUser[],
    roles,
    canManage:
      ctx.user.is_admin ||
      ctx.permissions.includes("*") ||
      ctx.permissions.includes("people.manage"),
  };
});

export const listRoles = createServerFn({ method: "GET" }).handler(async () => {
  const { requireContext } = await import("./session.server");
  const { pmDb } = await import("./db.server");
  await requireContext();
  return { roles: await fetchRoles(await pmDb()) };
});

async function fetchRoles(db: Awaited<ReturnType<(typeof import("./db.server"))["pmDb"]>>) {
  const [{ data: roles }, { data: users }] = await Promise.all([
    db.from("pm_roles").select("*").order("is_system", { ascending: false }).order("name"),
    db.from("pm_users").select("role_id"),
  ]);
  const counts = new Map<string, number>();
  for (const u of (users ?? []) as { role_id: string | null }[]) {
    if (u.role_id) counts.set(u.role_id, (counts.get(u.role_id) ?? 0) + 1);
  }
  return ((roles ?? []) as Record<string, unknown>[]).map((r): PmRole => ({
    id: r["id"] as string,
    name: r["name"] as string,
    description: (r["description"] as string | null) ?? null,
    permissions: Array.isArray(r["permissions"]) ? (r["permissions"] as string[]) : [],
    is_system: !!r["is_system"],
    created_at: r["created_at"] as string,
    user_count: counts.get(r["id"] as string) ?? 0,
  }));
}

export const createUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createUserSchema.parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./session.server");
    const { pmDb, logActivity, mapUser, USER_COLS } = await import("./db.server");
    const { hashPassword, validatePasswordStrength } = await import("./password.server");
    const ctx = await requirePermission("people.manage");
    if (data.is_admin && !ctx.user.is_admin) fail("Only administrators can create administrators.");
    const weak = validatePasswordStrength(data.password);
    if (weak) fail(weak);

    const db = await pmDb();
    const { data: clash } = await db
      .from("pm_users")
      .select("id")
      .ilike("username", data.username)
      .maybeSingle();
    if (clash) fail("That username is already taken.");

    const { data: row, error } = await db
      .from("pm_users")
      .insert({
        username: data.username.toLowerCase(),
        display_name: data.display_name,
        email: data.email ? data.email : null,
        password_hash: await hashPassword(data.password),
        role_id: data.role_id ?? null,
        is_admin: data.is_admin,
        must_change_password: data.must_change_password,
        avatar_color: data.avatar_color ?? pickColor(data.username),
      })
      .select(USER_COLS)
      .single();
    if (error || !row) fail(error?.message ?? "Could not create the account.");
    await logActivity(db, {
      user_id: ctx.user.id,
      action: "people.created",
      meta: { username: data.username, display_name: data.display_name },
    });
    return { ok: true as const, user: mapUser(row) };
  });

export const updateUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateUserSchema.parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./session.server");
    const { pmDb, logActivity, mapUser, USER_COLS } = await import("./db.server");
    const ctx = await requirePermission("people.manage");
    const db = await pmDb();

    const { data: target } = await db
      .from("pm_users")
      .select("id, is_admin, is_active")
      .eq("id", data.id)
      .maybeSingle();
    if (!target) fail("Member not found.");
    if (data.is_admin !== undefined && !ctx.user.is_admin) {
      fail("Only administrators can change administrator status.");
    }
    if (target["is_admin"] && !ctx.user.is_admin)
      fail("Only administrators can edit administrators.");
    if (data.is_active === false && data.id === ctx.user.id)
      fail("You cannot deactivate yourself.");

    // Never leave the workspace without an active administrator.
    if ((data.is_admin === false || data.is_active === false) && target["is_admin"]) {
      const { count } = await db
        .from("pm_users")
        .select("id", { count: "exact", head: true })
        .eq("is_admin", true)
        .eq("is_active", true);
      if ((count ?? 0) <= 1) fail("This is the last active administrator.");
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.display_name !== undefined) patch["display_name"] = data.display_name;
    if (data.email !== undefined) patch["email"] = data.email ? data.email : null;
    if (data.role_id !== undefined) patch["role_id"] = data.role_id;
    if (data.is_admin !== undefined) patch["is_admin"] = data.is_admin;
    if (data.is_active !== undefined) patch["is_active"] = data.is_active;
    if (data.avatar_color !== undefined) patch["avatar_color"] = data.avatar_color;

    const { data: row, error } = await db
      .from("pm_users")
      .update(patch)
      .eq("id", data.id)
      .select(USER_COLS)
      .single();
    if (error || !row) fail(error?.message ?? "Could not update the member.");
    await logActivity(db, {
      user_id: ctx.user.id,
      action: "people.updated",
      meta: {
        target: row["display_name"],
        fields: Object.keys(patch).filter((k) => k !== "updated_at"),
      },
    });
    return { ok: true as const, user: mapUser(row) };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resetPasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const { hashPassword, validatePasswordStrength } = await import("./password.server");
    const ctx = await requirePermission("people.manage");
    const weak = validatePasswordStrength(data.password);
    if (weak) fail(weak);
    const db = await pmDb();
    const { data: target } = await db
      .from("pm_users")
      .select("id, is_admin, display_name")
      .eq("id", data.id)
      .maybeSingle();
    if (!target) fail("Member not found.");
    if (target["is_admin"] && !ctx.user.is_admin)
      fail("Only administrators can reset an administrator's password.");
    await db
      .from("pm_users")
      .update({
        password_hash: await hashPassword(data.password),
        must_change_password: data.must_change_password,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    await logActivity(db, {
      user_id: ctx.user.id,
      action: "people.password_reset",
      meta: { target: target["display_name"] },
    });
    return { ok: true as const };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requirePermission("people.manage");
    if (data.id === ctx.user.id) fail("You cannot delete yourself.");
    const db = await pmDb();
    const { data: target } = await db
      .from("pm_users")
      .select("id, is_admin, display_name")
      .eq("id", data.id)
      .maybeSingle();
    if (!target) fail("Member not found.");
    if (target["is_admin"]) fail("Deactivate administrators instead of deleting them.");
    await db.from("pm_users").delete().eq("id", data.id);
    await logActivity(db, {
      user_id: ctx.user.id,
      action: "people.deleted",
      meta: { target: target["display_name"] },
    });
    return { ok: true as const };
  });

export const saveRole = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => saveRoleSchema.parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requirePermission("roles.manage");
    const db = await pmDb();

    if (data.id) {
      const { data: existing } = await db
        .from("pm_roles")
        .select("id, name, is_system, permissions")
        .eq("id", data.id)
        .maybeSingle();
      if (!existing) fail("Role not found.");
      const isAdminRole = existing["name"] === "Administrator";
      if (isAdminRole) fail("The Administrator role cannot be edited.");
      const patch: Record<string, unknown> = {
        description: data.description ? data.description : null,
        permissions: data.permissions,
      };
      if (!existing["is_system"]) patch["name"] = data.name;
      const { error } = await db.from("pm_roles").update(patch).eq("id", data.id);
      if (error) fail(error.message);
      await logActivity(db, {
        user_id: ctx.user.id,
        action: "roles.updated",
        meta: { role: existing["is_system"] ? existing["name"] : data.name },
      });
      return { ok: true as const, id: data.id };
    }

    const { data: created, error } = await db
      .from("pm_roles")
      .insert({
        name: data.name,
        description: data.description ? data.description : null,
        permissions: data.permissions,
        is_system: false,
      })
      .select("id")
      .single();
    if (error || !created) {
      fail(
        error?.code === "23505"
          ? "A role with that name already exists."
          : (error?.message ?? "Could not create the role."),
      );
    }
    await logActivity(db, {
      user_id: ctx.user.id,
      action: "roles.created",
      meta: { role: data.name },
    });
    return { ok: true as const, id: created["id"] as string };
  });

export const deleteRole = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requirePermission("roles.manage");
    const db = await pmDb();
    const { data: role } = await db
      .from("pm_roles")
      .select("id, name, is_system")
      .eq("id", data.id)
      .maybeSingle();
    if (!role) fail("Role not found.");
    if (role["is_system"]) fail("Built-in roles cannot be deleted.");
    await db.from("pm_users").update({ role_id: null }).eq("role_id", data.id);
    await db.from("pm_roles").delete().eq("id", data.id);
    await logActivity(db, {
      user_id: ctx.user.id,
      action: "roles.deleted",
      meta: { role: role["name"] },
    });
    return { ok: true as const };
  });

function pickColor(seed: string): string {
  const palette = [
    "#7c3aed",
    "#db2777",
    "#ea580c",
    "#ca8a04",
    "#16a34a",
    "#0891b2",
    "#2563eb",
    "#4f46e5",
  ];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length] ?? "#7c3aed";
}

function fail(message: string): never {
  throw new Error(message);
}
