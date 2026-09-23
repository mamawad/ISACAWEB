import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { ManageContext } from "./permissions";

// Kept permissive on purpose: an empty submit must surface as a friendly
// message from the handler, not a thrown ZodError (which blanks the page).
const loginSchema = z.object({
  username: z.string().trim().max(64).catch(""),
  password: z.string().catch(""),
  remember: z.boolean().optional().default(false),
});

const changePasswordSchema = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: z.string().min(8, "New password must be at least 8 characters."),
});

function callerIp(): string {
  const forwarded = getRequestHeader("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return getRequestHeader("cf-connecting-ip") ?? "unknown";
}

function fail(message: string): never {
  throw new Error(message);
}

/** Who is signed in (null when nobody). Called by the /manage layout on every load. */
export const getManageContext = createServerFn({ method: "GET" }).handler(
  async (): Promise<ManageContext | null> => {
    const { loadContext } = await import("./session.server");
    try {
      return await loadContext();
    } catch (err) {
      console.error("[manage] context failed:", err);
      return null;
    }
  },
);

/**
 * Sign in with username + password. Rate limited per address. The very first
 * "admin" login bootstraps the administrator account from MANAGE_ADMIN_PASSWORD
 * so no credential ever has to live in the repository.
 */
export const manageLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    if (!data.username || !data.password) {
      return { ok: false as const, error: "Enter your username and password." };
    }
    const [{ checkLoginLockout, clearLoginAttempts, recordFailedLogin }, { pmDb, logActivity }] =
      await Promise.all([import("@/lib/admin.server"), import("./db.server")]);
    const { hashPassword, verifyPassword } = await import("./password.server");
    const { getManageSession, loadContext } = await import("./session.server");

    const ip = callerIp();
    const lockout = await checkLoginLockout(ip);
    if (lockout.blocked) {
      return {
        ok: false as const,
        error: `Too many attempts. Try again in ${lockout.retryAfterMinutes} minute(s).`,
      };
    }

    const db = await pmDb();
    const username = data.username.toLowerCase();
    const { data: found } = await db
      .from("pm_users")
      .select("id, password_hash, is_active")
      .ilike("username", username)
      .maybeSingle();

    let userId: string | null = null;

    if (!found && username === "admin") {
      // Bootstrap: create the administrator from the environment secret.
      const bootstrap = process.env["MANAGE_ADMIN_PASSWORD"];
      if (!bootstrap) {
        return {
          ok: false as const,
          error:
            "The administrator account has not been set up yet. Set MANAGE_ADMIN_PASSWORD in the environment and try again.",
        };
      }
      if (data.password !== bootstrap) {
        const state = await recordFailedLogin(ip);
        return {
          ok: false as const,
          error: state.blocked
            ? `Too many attempts. Try again in ${state.retryAfterMinutes} minute(s).`
            : "Wrong username or password.",
        };
      }
      const { data: adminRole } = await db
        .from("pm_roles")
        .select("id")
        .eq("name", "Administrator")
        .maybeSingle();
      const { data: created, error } = await db
        .from("pm_users")
        .insert({
          username: "admin",
          display_name: "Administrator",
          password_hash: await hashPassword(bootstrap),
          role_id: adminRole?.["id"] ?? null,
          is_admin: true,
          avatar_color: "#7c3aed",
        })
        .select("id")
        .single();
      if (error || !created) {
        console.error("[manage] admin bootstrap failed:", error);
        return { ok: false as const, error: "Could not create the administrator account." };
      }
      userId = created["id"] as string;
      await logActivity(db, { user_id: userId, action: "workspace.bootstrapped" });
    } else {
      if (!found || found["is_active"] === false) {
        await recordFailedLogin(ip);
        return { ok: false as const, error: "Wrong username or password." };
      }
      const storedHash = found["password_hash"] as string;
      const { isUnsupportedHash } = await import("./password.server");
      let good = await verifyPassword(data.password, storedHash);

      // Legacy hashes were written with a work factor this runtime cannot
      // replay. Repair the administrator account from the bootstrap secret.
      if (!good && isUnsupportedHash(storedHash)) {
        const bootstrap = process.env["MANAGE_ADMIN_PASSWORD"];
        if (username === "admin" && bootstrap && data.password === bootstrap) {
          await db
            .from("pm_users")
            .update({ password_hash: await hashPassword(bootstrap) })
            .eq("id", found["id"] as string);
          good = true;
        } else {
          return {
            ok: false as const,
            error: "This account needs its password reset by an administrator.",
          };
        }
      }

      if (!good) {
        const state = await recordFailedLogin(ip);
        return {
          ok: false as const,
          error: state.blocked
            ? `Too many attempts. Try again in ${state.retryAfterMinutes} minute(s).`
            : "Wrong username or password.",
        };
      }
      userId = found["id"] as string;
    }

    await clearLoginAttempts(ip);
    const session = await getManageSession(data.remember);
    await session.update({ userId, impersonatorId: undefined, remember: data.remember });
    await db.from("pm_users").update({ last_login_at: new Date().toISOString() }).eq("id", userId);

    const context = await loadContext();
    return { ok: true as const, context };
  });

export const manageLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getManageSession } = await import("./session.server");
  const session = await getManageSession();
  await session.clear();
  return { ok: true as const };
});

export const changeMyPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => changePasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireContext } = await import("./session.server");
    const { pmDb } = await import("./db.server");
    const { hashPassword, verifyPassword, validatePasswordStrength } =
      await import("./password.server");
    const ctx = await requireContext();
    if (ctx.impersonator) fail("Stop viewing as this member before changing passwords.");
    const weak = validatePasswordStrength(data.next);
    if (weak) fail(weak);

    const db = await pmDb();
    const { data: row } = await db
      .from("pm_users")
      .select("password_hash")
      .eq("id", ctx.user.id)
      .single();
    if (!row || !(await verifyPassword(data.current, row["password_hash"] as string))) {
      fail("Current password is incorrect.");
    }
    await db
      .from("pm_users")
      .update({
        password_hash: await hashPassword(data.next),
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ctx.user.id);
    return { ok: true as const };
  });

/** Admin-only: open the workspace as another member sees it. */
export const impersonateUser = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const { requirePermission, getManageSession, fetchUserRow, loadContext } =
      await import("./session.server");
    const { pmDb, isUuid, logActivity } = await import("./db.server");
    const ctx = await requirePermission("people.impersonate");
    if (ctx.impersonator) fail("You are already viewing as another member.");
    if (!isUuid(data.userId)) fail("Invalid member.");
    if (data.userId === ctx.user.id) fail("That is you.");

    const db = await pmDb();
    const target = await fetchUserRow(db, data.userId);
    if (!target || target["is_active"] === false) fail("That member is not active.");
    if (target["is_admin"] && !ctx.user.is_admin) {
      fail("Only administrators can view as an administrator.");
    }

    const session = await getManageSession();
    await session.update({ userId: data.userId, impersonatorId: ctx.user.id });
    await logActivity(db, {
      user_id: ctx.user.id,
      action: "people.impersonated",
      meta: { target: String(target["display_name"] ?? "") },
    });
    return { ok: true as const, context: await loadContext() };
  });

export const stopImpersonating = createServerFn({ method: "POST" }).handler(async () => {
  const { getManageSession, loadContext } = await import("./session.server");
  const session = await getManageSession();
  const impId = session.data.impersonatorId;
  if (!impId) return { ok: true as const, context: await loadContext() };
  await session.update({ userId: impId, impersonatorId: undefined });
  return { ok: true as const, context: await loadContext() };
});
