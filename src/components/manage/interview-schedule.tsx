import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Loader2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listInterviews, saveInterviewFeedback } from "@/lib/pm/interviews.functions";
import { DECISIONS, type InterviewRow } from "@/lib/pm/interview-teams";
import { Field, SelectField, inputClass } from "@/components/manage/fields";
import { EmptyState } from "@/components/manage/shell";
import { useCan } from "@/components/manage/manage-context";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const RIYADH = "Asia/Riyadh";

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: RIYADH,
  });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: RIYADH,
  });
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: RIYADH });
}

function decisionLabel(value: string | undefined): string {
  return DECISIONS.find((d) => d.value === value)?.label ?? DECISIONS[0]!.label;
}

function DecisionBadge({ value }: { value: string | null | undefined }) {
  const v = value ?? "pending";
  const tone =
    v === "accepted"
      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20"
      : v === "rejected"
        ? "bg-rose-500/10 text-rose-700 ring-rose-500/20"
        : v === "waitlist"
          ? "bg-amber-500/10 text-amber-700 ring-amber-500/20"
          : "bg-black/[0.05] text-muted-foreground ring-black/10";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        tone,
      )}
    >
      {decisionLabel(v)}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid gap-0.5">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-sm break-words text-foreground">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

function InterviewDialog({
  row,
  onClose,
}: {
  row: InterviewRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const canWrite = useCan()("interviews.feedback");
  const [rating, setRating] = useState("");
  const [decision, setDecision] = useState("pending");
  const [notes, setNotes] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (row && loadedFor !== row.id) {
    setLoadedFor(row.id);
    setRating(row.feedback?.rating ? String(row.feedback.rating) : "");
    setDecision(row.feedback?.decision ?? "pending");
    setNotes(row.feedback?.notes ?? "");
  }

  const save = useMutation({
    mutationFn: () =>
      saveInterviewFeedback({
        data: {
          signup_id: row!.id,
          rating: rating ? Number(rating) : null,
          decision: decision as "pending",
          notes,
        },
      }),
    onSuccess: async () => {
      toast.success("Feedback saved");
      await qc.invalidateQueries({ queryKey: ["pm", "interviews"] });
      onClose();
    },
    onError: (err) => toast.error("Could not save feedback", { description: String(err) }),
  });

  return (
    <Dialog open={!!row} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="manage-theme max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {row ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{row.full_name}</DialogTitle>
              <DialogDescription>
                {dayLabel(row.interview_slot)} at {timeLabel(row.interview_slot)} (Riyadh time)
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <Detail label="Applying for" value={row.preferred_role} />
              <Detail label="Team" value={row.preferred_team} />
              <Detail label="Email" value={row.email} />
              <Detail label="Phone" value={row.phone} />
              <Detail label="Student ID" value={row.student_id} />
              <Detail label="ISACA ID" value={row.isaca_id} />
              <Detail label="College" value={row.college} />
              <Detail label="Program" value={row.program} />
              <Detail label="Year of study" value={row.year_of_study} />
              <Detail label="Applied on" value={dayLabel(row.created_at)} />
            </div>
            <div className="border-t border-black/5 pt-3">
              <Detail label="Why they want to join" value={row.reason} />
            </div>

            <div className="mt-2 grid gap-4 rounded-xl bg-black/[0.03] p-4">
              <p className="font-display text-sm font-semibold">Interview feedback</p>
              {!canWrite ? (
                <p className="text-xs text-muted-foreground">
                  You can read the feedback here, but only members with the feedback permission can
                  change it.
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Score out of 5">
                  <SelectField
                    value={rating}
                    onChange={setRating}
                    disabled={!canWrite}
                    allowEmpty="No score"
                    options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} / 5` }))}
                  />
                </Field>
                <Field label="Decision">
                  <SelectField
                    value={decision}
                    onChange={setDecision}
                    disabled={!canWrite}
                    options={DECISIONS.map((d) => ({ value: d.value, label: d.label }))}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <textarea
                  className={cn(inputClass, "h-32 resize-y py-2")}
                  value={notes}
                  disabled={!canWrite}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
              {row.feedback?.updated_at ? (
                <p className="text-xs text-muted-foreground">
                  Last saved by {row.feedback.author_name ?? "a member"} on{" "}
                  {dayLabel(row.feedback.updated_at)}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-black/[0.05]"
              >
                Close
              </button>
              <button
                type="button"
                hidden={!canWrite}
                disabled={save.isPending || !canWrite}
                onClick={() => save.mutate()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {save.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save feedback
              </button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Upcoming (and past) interview schedule, grouped by day. Pass a team name to
 * show one track only.
 */
export function InterviewSchedule({ team }: { team?: string | undefined }) {
  const [openRow, setOpenRow] = useState<InterviewRow | null>(null);
  const canView = useCan()("interviews.view");
  const { data, isLoading } = useQuery({
    queryKey: ["pm", "interviews"],
    queryFn: () => listInterviews(),
    staleTime: 30_000,
    enabled: canView,
  });

  const rows = useMemo(() => {
    const all = data?.interviews ?? [];
    return team ? all.filter((r) => r.preferred_team === team) : all;
  }, [data, team]);

  const now = Date.now();
  const upcoming = rows.filter((r) => Date.parse(r.interview_slot) >= now);
  const past = rows.filter((r) => Date.parse(r.interview_slot) < now);

  const groups = useMemo(() => {
    const map = new Map<string, InterviewRow[]>();
    for (const r of [...upcoming, ...[...past].reverse()]) {
      const k = dayKey(r.interview_slot);
      const list = map.get(k) ?? [];
      list.push(r);
      map.set(k, list);
    }
    return [...map.entries()];
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!canView) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="You do not have access to interviews"
        description="Ask an administrator to give your role the interview permission."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No interviews booked"
        description="Interviews appear here as soon as an applicant books a slot on the Join Us form."
      />
    );
  }

  return (
    <>
      <div className="grid gap-6">
        {groups.map(([key, list]) => {
          const isPast = Date.parse(list[0]!.interview_slot) < now;
          return (
            <section key={key}>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="font-display text-base font-bold">
                  {dayLabel(list[0]!.interview_slot)}
                </h2>
                <span className="rounded-full bg-black/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {list.length} interview{list.length === 1 ? "" : "s"}
                </span>
                {isPast ? (
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Past
                  </span>
                ) : null}
              </div>
              <div className="card-glow divide-y divide-black/5 overflow-hidden">
                {list.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "flex flex-col gap-3 p-4 sm:flex-row sm:items-center",
                      isPast && "opacity-70",
                    )}
                  >
                    <span className="font-mono text-lg font-bold text-primary tabular-nums">
                      {timeLabel(r.interview_slot)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.full_name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {r.preferred_role ?? "No role selected"}
                        {team ? "" : ` · ${r.preferred_team ?? "No team"}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.feedback?.rating ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          {r.feedback.rating}/5
                        </span>
                      ) : null}
                      <DecisionBadge value={r.feedback?.decision} />
                      <button
                        type="button"
                        onClick={() => setOpenRow(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                      >
                        <UserRound className="h-3.5 w-3.5" /> View details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <InterviewDialog row={openRow} onClose={() => setOpenRow(null)} />
    </>
  );
}
