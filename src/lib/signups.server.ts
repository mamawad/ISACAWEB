import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Database } from "@/integrations/supabase/types";
import { resolveProgram } from "./signups.schema";
import type { SignupInput, SignupRow } from "./signups.schema";

/**
 * Server-local Supabase client using the publishable (anon) key.
 * Used for the public Join Us insert, which is allowed by an anon INSERT
 * RLS policy. No session persistence — server only.
 */
function getPublishableClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase publishable config is missing.");

  // New-format sb_ keys are opaque, not JWTs: send only apikey, drop the
  // default Authorization bearer so PostgREST doesn't reject with
  // "Expected 3 parts in JWT; got 1".
  const customFetch: typeof fetch = (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    }
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: customFetch },
  });
}

/**
 * Insert a new signup row (public, anon-scoped by RLS). Returns the new row
 * id when the Data API hands it back, so the alert email can be stamped
 * against it.
 */
export async function createSignupRecord(input: SignupInput): Promise<string | null> {
  const supabase = getPublishableClient();
  const program = resolveProgram(input);
  const interviewSlot =
    input.interview_slot && input.interview_slot.length > 0 ? input.interview_slot : null;
  const { error } = await supabase.from("chapter_signups").insert({
    full_name: input.full_name,
    email: input.email,
    student_id: input.student_id,
    isaca_id: input.isaca_id ? input.isaca_id : null,
    college: input.college,
    program,
    major: program,
    year_of_study: input.year_of_study,
    preferred_team: input.preferred_team ? input.preferred_team : null,
    preferred_role: input.preferred_role ? input.preferred_role : null,
    phone: input.phone ? input.phone : null,
    reason: input.reason ? input.reason : null,
    interview_slot: interviewSlot,
  });
  if (error) {
    // Postgres unique-violation on interview_slot means the slot was taken
    // while the form was open.
    if (error.code === "23505") {
      throw new Error("That interview slot was just taken — please pick another.");
    }
    throw error;
  }

  // Anon has no SELECT on the table, so look the new row up with the
  // service-role client to get its id for the alert email.
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("chapter_signups")
      .select("id")
      .eq("email", input.email)
      .eq("student_id", input.student_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

/** Stamp a row as notified once its alert email has gone out. */
async function markNotified(id: string): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("chapter_signups")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", id);
  } catch (err) {
    console.error("[chapter-signup] could not stamp notified_at:", err);
  }
}

/**
 * Best-effort email notification to the chapter's backend-only address.
 *
 * Sends a branded application-alert email through Lovable's managed email
 * API using the verified notify.auisaca.com sender domain. Sending is
 * best-effort: the row is already saved before this runs, so a mail failure
 * never loses the application. Suppressed recipients are expected and
 * silently skipped.
 */
export async function notifySignup(input: SignupInput, rowId?: string | null): Promise<boolean> {
  const to = process.env["NOTIFICATION_EMAIL"];
  if (!to) return false;

  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
  const { labelSlotRangeISO } = await import("./interview-slots");

  const program = resolveProgram(input);
  const interviewLabel = input.interview_slot ? labelSlotRangeISO(input.interview_slot) : undefined;

  const idempotencyKey = rowId
    ? `signup-alert-${rowId}`
    : `signup-${input.email}-${input.student_id}`;

  const send = () =>
    sendTemplateEmail("application-alert", to, {
      templateData: {
        fullName: input.full_name,
        email: input.email,
        studentId: input.student_id,
        isacaId: input.isaca_id || undefined,
        college: input.college,
        program,
        yearOfStudy: input.year_of_study,
        preferredTeam: input.preferred_team || undefined,
        preferredRole: input.preferred_role || undefined,
        interviewSlot: interviewLabel,
        phone: input.phone || undefined,
        reason: input.reason || undefined,
        adminUrl: "/admin",
      },
      idempotencyKey,
      replyTo: input.email,
    });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await send();
      if (!result.sent) {
        console.log(
          `[chapter-signup] notification to ${to} suppressed (${result.reason}) for ${input.email}`,
        );
        return false;
      }
      if (rowId) await markNotified(rowId);
      return true;
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      const code = (err as { code?: string } | null)?.code;
      const retryable =
        attempt === 1 &&
        code !== "domain_not_verified" &&
        code !== "emails_disabled" &&
        status !== 429;
      if (retryable) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      // Log and swallow — the signup is already saved and can be resent
      // from the admin page.
      console.error("[chapter-signup] notification email failed:", err);
      return false;
    }
  }
  return false;
}

/** Resend the alert for one stored application. Admin only. */
export async function resendSignupAlert(row: SignupRow): Promise<boolean> {
  return notifySignup(
    {
      full_name: row.full_name,
      email: row.email,
      student_id: row.student_id,
      isaca_id: row.isaca_id ?? "",
      college: row.college ?? "",
      program: row.program ?? row.major,
      year_of_study: row.year_of_study,
      preferred_team: row.preferred_team ?? "",
      preferred_role: row.preferred_role ?? "",
      phone: row.phone ?? "",
      reason: row.reason ?? "",
      interview_slot: row.interview_slot ?? "",
    } as unknown as SignupInput,
    row.id,
  );
}

/** Timing-safe comparison of the admin password against the server secret. */
export function verifyAdminPassword(input: string): boolean {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Read all signups using the service-role client (bypasses RLS). Admin only. */
export async function fetchAllSignups(): Promise<SignupRow[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("chapter_signups")
    .select(
      "id, full_name, email, student_id, isaca_id, college, program, major, year_of_study, preferred_team, preferred_role, phone, reason, interview_slot, created_at, notified_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SignupRow[];
}

/** Delete a signup row by id. Admin only — caller must gate on the session. */
export async function deleteSignupRecord(id: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("chapter_signups").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Public: the set of interview slots already booked. Returns only the ISO
 * timestamps so the form can grey them out — no personal data. Read through
 * the SECURITY DEFINER `taken_interview_slots` function since anon has no
 * SELECT on the signups table itself.
 */
export async function fetchTakenSlots(): Promise<string[]> {
  const supabase = getPublishableClient();
  const { data, error } = await supabase.rpc("taken_interview_slots");
  if (error || !data) return [];
  return (data as { interview_slot: string | null }[])
    .map((r) => r.interview_slot)
    .filter((v): v is string => !!v);
}
