import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { INTERVIEW_TRACKS, trackBySlug } from "@/lib/pm/interview-teams";
import { PageHeader } from "@/components/manage/shell";
import { InterviewSchedule } from "@/components/manage/interview-schedule";

export const Route = createFileRoute("/manage/interviews/$track")({
  head: () => ({ meta: [{ title: "Interviews · ISACA Alfaisal workspace" }] }),
  component: TrackPage,
});

function TrackPage() {
  const { track } = Route.useParams();
  const info = trackBySlug(track);

  return (
    <div>
      <PageHeader
        eyebrow="Interviews"
        title={info?.label ?? "Unknown team"}
        description={
          info
            ? "Interviews booked for this team, grouped by day (Riyadh time)."
            : "Pick one of the teams from the sidebar."
        }
        actions={
          <Link
            to="/manage/interviews"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-black/[0.05]"
          >
            <ArrowLeft className="h-4 w-4" /> All interviews
          </Link>
        }
      />
      {info ? (
        <InterviewSchedule team={info.team} />
      ) : (
        <div className="card-glow p-6 text-sm text-muted-foreground">
          Available teams: {INTERVIEW_TRACKS.map((t) => t.label).join(", ")}.
        </div>
      )}
    </div>
  );
}
