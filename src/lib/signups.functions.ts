import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { signupSchema } from "./signups.schema";
import {
  createSignupRecord,
  deleteSignupRecord,
  notifySignup,
  resendSignupAlert,
  verifyAdminPassword,
  fetchAllSignups,
  fetchTakenSlots,
} from "./signups.server";
import {
  checkLoginLockout,
  clearAdminSession,
  clearLoginAttempts,
  isAdminUnlocked,
  recordFailedLogin,
  setAdminUnlocked,
} from "./admin.server";

/**
 * Public: submit a new Join Us signup. Anyone can call this. Inserts the row
 * (anon INSERT allowed by RLS) and fires a best-effort email notification.
 */
export const submitSignup = createServerFn({ method: "POST" })
  .inputValidator((data) => signupSchema.parse(data))
  .handler(async ({ data }) => {
    const rowId = await createSignupRecord(data);
    // Email is best-effort — never fail the signup if it can't send.
    // Failures leave notified_at null so /admin can resend.
    try {
      await notifySignup(data, rowId);
    } catch (err) {
      console.error("[chapter-signup] notification failed:", err);
    }
    return { ok: true as const };
  });

function callerIp(): string {
  const forwarded = getRequestHeader("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return getRequestHeader("cf-connecting-ip") ?? "unknown";
}

/**
 * Admin: exchange the shared password for an encrypted session cookie.
 * Rate limited per address to make brute forcing impractical.
 */
export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const ip = callerIp();
    const lockout = await checkLoginLockout(ip);
    if (lockout.blocked) {
      return {
        ok: false as const,
        lockedMinutes: lockout.retryAfterMinutes,
        signups: [],
      };
    }

    if (!verifyAdminPassword(data.password)) {
      const state = await recordFailedLogin(ip);
      return {
        ok: false as const,
        lockedMinutes: state.blocked ? state.retryAfterMinutes : 0,
        signups: [],
      };
    }

    await clearLoginAttempts(ip);
    await setAdminUnlocked();
    // Return the rows in the same response so login never depends on the
    // session cookie making a round trip.
    const signups = await fetchAllSignups();
    return { ok: true as const, lockedMinutes: 0, signups };
  });

/** Admin: clear the session cookie. */
export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  await clearAdminSession();
  return { ok: true as const };
});

/**
 * Admin-only: list all signups. Gated on the encrypted session cookie, then
 * read via the service-role client (bypasses RLS).
 */
export const listSignups = createServerFn({ method: "POST" }).handler(async () => {
  if (!(await isAdminUnlocked())) {
    return { ok: false as const, signups: [] };
  }
  const signups = await fetchAllSignups();
  return { ok: true as const, signups };
});

/**
 * Admin-only: delete a signup by id. Gated on the encrypted session cookie;
 * the delete runs through the service-role client (RLS denies DELETE).
 */
export const deleteSignup = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
      throw new Error("Invalid signup id.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    if (!(await isAdminUnlocked())) {
      return { ok: false as const };
    }
    await deleteSignupRecord(data.id);
    return { ok: true as const };
  });

/**
 * Public: booked interview slots so the form can grey them out. Returns only
 * ISO timestamps — no personal data.
 */
export const getTakenInterviewSlots = createServerFn({ method: "GET" }).handler(async () => {
  return { slots: await fetchTakenSlots() };
});

/**
 * Admin-only: the tokenised live-feed URL to paste into Excel / Sheets.
 * Session-gated so the token never leaks to anonymous visitors.
 */
export const getLiveExportUrl = createServerFn({ method: "POST" }).handler(async () => {
  if (!(await isAdminUnlocked())) return { ok: false as const, url: "" };
  const token = process.env["EXPORT_TOKEN"];
  if (!token) return { ok: false as const, url: "" };
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? "";
  const proto = getRequestHeader("x-forwarded-proto") ?? "https";
  return {
    ok: true as const,
    url: `${proto}://${host}/api/public/signups-export?key=${token}`,
  };
});

/**
 * Admin-only: resend the alert email for applications that were never
 * emailed. Pass an id for one row, or omit it to send every missing alert.
 */
export const resendSignupAlerts = createServerFn({ method: "POST" })
  .inputValidator((data: { id?: string }) => data ?? {})
  .handler(async ({ data }) => {
    if (!(await isAdminUnlocked())) {
      return { ok: false as const, sent: 0, failed: 0, signups: [] };
    }
    const all = await fetchAllSignups();
    const targets = data.id
      ? all.filter((r) => r.id === data.id)
      : all.filter((r) => !r.notified_at);

    let sent = 0;
    let failed = 0;
    for (const row of targets) {
      const ok = await resendSignupAlert(row);
      if (ok) sent++;
      else failed++;
    }

    return { ok: true as const, sent, failed, signups: await fetchAllSignups() };
  });
