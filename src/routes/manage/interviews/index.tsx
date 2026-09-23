import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { listInterviews } from "@/lib/pm/interviews.functions";
import { INTERVIEW_TRACKS } from "@/lib/pm/interview-teams";
import { PageHeader } from "@/components/manage/shell";
import { useCan } from "@/components/manage/manage-context";
import { InterviewSchedule } from "@/components/manage/interview-schedule";

export const Route = createFileRoute("/manage/interviews/")({
  head: () => ({ meta: [{ title: "Interviews · ISACA Alfaisal workspace" }] }),
  component: InterviewsIndex,
});

function InterviewsIndex() {
  const canView = useCan()("interviews.view");
  const { data } = useQuery({
    queryKey: ["pm", "interviews"],
    queryFn: () => listInterviews(),
    staleTime: 30_000,
    enabled: canView,
  });
  const rows = data?.interviews ?? [];
  const now = Date.now();

  return (
    <div>
      <PageHeader
        eyebrow="Recruitment"
        title="Interviews"
        description="Every booked interview, grouped by day. Pick a team to focus on one track."
      />

      {canView ? (
      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {INTERVIEW_TRACKS.map((t) => {
          const list = rows.filter((r) => r.preferred_team === t.team);
          const upcoming = list.filter((r) => Date.parse(r.interview_slot) >= now).length;
          return (
            <Link
              key={t.slug}
              to="/manage/interviews/$track"
              params={{ track: t.slug }}
              className="card-glow group p-4 transition hover:-translate-y-0.5"
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-xl text-white"
                style={{ backgroundColor: t.color }}
              >
                <CalendarClock className="h-4 w-4" />
              </span>
              <p className="mt-3 font-display text-sm font-bold">{t.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {upcoming} upcoming · {list.length} total
              </p>
            </Link>
          );
        })}
      </div>
      ) : null}

      <InterviewSchedule />
    </div>
  );
}
