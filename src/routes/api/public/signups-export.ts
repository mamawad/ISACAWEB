import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";
import { fetchAllSignups } from "@/lib/signups.server";
import type { SignupRow } from "@/lib/signups.schema";

/**
 * Live sign-ups feed for Excel / Google Sheets.
 *
 * GET /api/public/signups-export?key=<EXPORT_TOKEN>
 *
 * Public prefix, so the token is the only gate: compared in constant time
 * against the server-side EXPORT_TOKEN secret. Returns CSV, which Excel can
 * connect to with Data > From Web and refresh on a schedule.
 */
export const Route = createFileRoute("/api/public/signups-export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env["EXPORT_TOKEN"];
        const provided = new URL(request.url).searchParams.get("key") ?? "";
        if (!expected || !safeEqual(provided, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const rows = await fetchAllSignups();
        const lines = [
          COLUMNS.map((c) => csvCell(c.header)).join(","),
          ...rows.map((r) => COLUMNS.map((c) => csvCell(c.value(r))).join(",")),
        ];
        // BOM so Excel reads UTF-8 names correctly.
        return new Response("\uFEFF" + lines.join("\r\n"), {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "cache-control": "no-store",
            "content-disposition": 'inline; filename="isaca-signups.csv"',
          },
        });
      },
    },
  },
});

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

const COLUMNS: { header: string; value: (s: SignupRow) => string }[] = [
  { header: "Name", value: (s) => s.full_name },
  { header: "Email", value: (s) => s.email },
  { header: "Student ID", value: (s) => s.student_id },
  { header: "ISACA ID", value: (s) => s.isaca_id ?? "" },
  { header: "College", value: (s) => s.college ?? "" },
  { header: "Program", value: (s) => s.program ?? s.major },
  { header: "Year", value: (s) => s.year_of_study },
  { header: "Team", value: (s) => s.preferred_team ?? "" },
  { header: "Role", value: (s) => s.preferred_role ?? "" },
  { header: "Interview", value: (s) => s.interview_slot ?? "" },
  { header: "Phone", value: (s) => s.phone ?? "" },
  { header: "Reason", value: (s) => s.reason ?? "" },
  { header: "Submitted", value: (s) => s.created_at },
];

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
