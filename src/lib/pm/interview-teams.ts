/** The interview tracks shown in the workspace sidebar. */
export type InterviewTrack = {
  slug: string;
  /** Matches chapter_signups.preferred_team */
  team: string;
  label: string;
  short: string;
  color: string;
};

export const INTERVIEW_TRACKS: InterviewTrack[] = [
  {
    slug: "academic",
    team: "Academic & Technical Programs",
    label: "Academic & Technical Programs",
    short: "Academic",
    color: "#0ea5a3",
  },
  {
    slug: "public-relations",
    team: "Public Relations",
    label: "Public Relations",
    short: "PR",
    color: "#7c3aed",
  },
  {
    slug: "partnerships",
    team: "Partnerships & Operations",
    label: "Partnerships & Operations",
    short: "Partnerships",
    color: "#f59e0b",
  },
  {
    slug: "it",
    team: "IT & Digital Development",
    label: "IT & Digital Development",
    short: "IT",
    color: "#2563eb",
  },
];

export function trackBySlug(slug: string): InterviewTrack | undefined {
  return INTERVIEW_TRACKS.find((t) => t.slug === slug);
}

export type InterviewFeedback = {
  rating: number | null;
  decision: string;
  notes: string;
  author_name: string | null;
  updated_at: string | null;
};

export type InterviewRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  student_id: string;
  isaca_id: string | null;
  college: string | null;
  program: string | null;
  year_of_study: string;
  preferred_team: string | null;
  preferred_role: string | null;
  reason: string | null;
  interview_slot: string;
  created_at: string;
  feedback: InterviewFeedback | null;
};

export const DECISIONS = [
  { value: "pending", label: "Not decided yet" },
  { value: "accepted", label: "Accepted" },
  { value: "waitlist", label: "Waitlist" },
  { value: "rejected", label: "Rejected" },
];
