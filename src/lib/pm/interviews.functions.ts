import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { InterviewRow } from "./interview-teams";

const SIGNUP_COLS =
  "id, full_name, email, phone, student_id, isaca_id, college, program, year_of_study, preferred_team, preferred_role, reason, interview_slot, created_at";

const feedbackSchema = z.object({
  signup_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  decision: z.enum(["pending", "accepted", "waitlist", "rejected"]).default("pending"),
  notes: z.string().max(4000).default(""),
});

/** Every booked interview, newest slot first, with any feedback already written. */
export const listInterviews = createServerFn({ method: "GET" }).handler(async () => {
  const { requirePermission } = await import("./session.server");
  const { pmDb } = await import("./db.server");
  await requirePermission("interviews.view");
  const db = await pmDb();

  const [{ data: signups }, { data: feedback }] = await Promise.all([
    db
      .from("chapter_signups")
      .select(SIGNUP_COLS)
      .not("interview_slot", "is", null)
      .order("interview_slot", { ascending: true }),
    db
      .from("pm_interview_feedback")
      .select("signup_id, rating, decision, notes, updated_at, author:pm_users(display_name)"),
  ]);

  const byId = new Map<string, InterviewRow["feedback"]>();
  for (const f of (feedback ?? []) as Record<string, unknown>[]) {
    byId.set(String(f["signup_id"]), {
      rating: (f["rating"] as number | null) ?? null,
      decision: (f["decision"] as string) ?? "pending",
      notes: (f["notes"] as string) ?? "",
      author_name:
        ((f["author"] as { display_name?: string } | null)?.display_name as string) ?? null,
      updated_at: (f["updated_at"] as string) ?? null,
    });
  }

  const interviews: InterviewRow[] = ((signups ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r["id"]),
    full_name: String(r["full_name"]),
    email: String(r["email"]),
    phone: (r["phone"] as string | null) ?? null,
    student_id: String(r["student_id"] ?? ""),
    isaca_id: (r["isaca_id"] as string | null) ?? null,
    college: (r["college"] as string | null) ?? null,
    program: (r["program"] as string | null) ?? null,
    year_of_study: String(r["year_of_study"] ?? ""),
    preferred_team: (r["preferred_team"] as string | null) ?? null,
    preferred_role: (r["preferred_role"] as string | null) ?? null,
    reason: (r["reason"] as string | null) ?? null,
    interview_slot: String(r["interview_slot"]),
    created_at: String(r["created_at"]),
    feedback: byId.get(String(r["id"])) ?? null,
  }));

  return { interviews };
});

/** Save (or update) the feedback written after an interview. */
export const saveInterviewFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => feedbackSchema.parse(data))
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./session.server");
    const { pmDb } = await import("./db.server");
    const ctx = await requirePermission("interviews.feedback");
    const db = await pmDb();
    const { error } = await db.from("pm_interview_feedback").upsert(
      {
        signup_id: data.signup_id,
        rating: data.rating ?? null,
        decision: data.decision,
        notes: data.notes,
        author_id: ctx.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "signup_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
