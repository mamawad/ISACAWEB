import { useSession } from "@tanstack/react-start/server";

export type AdminSession = { unlocked?: boolean };

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("SESSION_SECRET is not set.");
  return {
    password,
    name: "chapter-admin",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: true,
      // "none" so the cookie survives the editor preview iframe (third-party context).
      sameSite: "none" as const,
      path: "/",
    },
  };
}

export async function getAdminSession() {
  return useSession<AdminSession>(sessionConfig());
}

export async function isAdminUnlocked(): Promise<boolean> {
  const session = await getAdminSession();
  return session.data.unlocked === true;
}

export async function setAdminUnlocked(): Promise<void> {
  const session = await getAdminSession();
  await session.update({ unlocked: true });
}

export async function clearAdminSession(): Promise<void> {
  const session = await getAdminSession();
  await session.clear();
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type RateLimitState = { blocked: boolean; retryAfterMinutes: number };

/** Returns whether this address is currently locked out of admin login. */
export async function checkLoginLockout(ip: string): Promise<RateLimitState> {
  const supabase = await admin();
  const { data } = await supabase
    .from("admin_login_attempts")
    .select("locked_until")
    .eq("ip", ip)
    .maybeSingle();

  const lockedUntil = data?.locked_until ? new Date(data.locked_until) : null;
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return {
      blocked: true,
      retryAfterMinutes: Math.max(
        1,
        Math.ceil((lockedUntil.getTime() - Date.now()) / 60000),
      ),
    };
  }
  return { blocked: false, retryAfterMinutes: 0 };
}

/** Record a failed attempt and lock the address out once the limit is hit. */
export async function recordFailedLogin(ip: string): Promise<RateLimitState> {
  const supabase = await admin();
  const { data } = await supabase
    .from("admin_login_attempts")
    .select("attempts, locked_until")
    .eq("ip", ip)
    .maybeSingle();

  const previous = data?.locked_until && new Date(data.locked_until).getTime() > Date.now()
    ? (data.attempts ?? 0)
    : data?.locked_until
      ? 0
      : (data?.attempts ?? 0);

  const attempts = previous + 1;
  const locked = attempts >= MAX_ATTEMPTS;
  const lockedUntil = locked
    ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString()
    : null;

  await supabase.from("admin_login_attempts").upsert(
    {
      ip,
      attempts: locked ? 0 : attempts,
      locked_until: lockedUntil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "ip" },
  );

  return locked
    ? { blocked: true, retryAfterMinutes: LOCKOUT_MINUTES }
    : { blocked: false, retryAfterMinutes: 0 };
}

/** Wipe the failure counter after a successful login. */
export async function clearLoginAttempts(ip: string): Promise<void> {
  const supabase = await admin();
  await supabase.from("admin_login_attempts").delete().eq("ip", ip);
}
