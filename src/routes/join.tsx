import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Loader2,
  TicketPercent,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHero } from "@/components/fx/page-hero";
import { Reveal } from "@/components/fx/reveal";
import { submitSignup, getTakenInterviewSlots } from "@/lib/signups.functions";
import {
  YEAR_OPTIONS,
  COLLEGES,
  COLLEGE_OPTIONS,
  OTHER,
  type CollegeName,
} from "@/lib/signups.schema";
import { TEAM_OPTIONS, rolesForTeam } from "@/lib/teams";
import {
  upcomingDates,
  bookingClosed,
  isLeadershipRole,
  slotsForDate,
  labelSlotRangeISO,
} from "@/lib/interview-slots";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

type JoinSearch = { team?: string; role?: string };

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>): JoinSearch => {
    const out: JoinSearch = {};
    const team = search["team"];
    const role = search["role"];
    if (typeof team === "string") out.team = team;
    if (typeof role === "string") out.role = role;
    return out;
  },
  head: () => ({
    meta: [
      { title: `Join Us · ${SITE.name}` },
      {
        name: "description",
        content:
          "Join the ISACA Student Chapter at Alfaisal University. Sign up to become a member and get involved in IT governance, risk, cybersecurity, and audit.",
      },
      { property: "og:title", content: `Join Us · ${SITE.name}` },
      {
        property: "og:description",
        content: "Sign up to become a member of the ISACA Student Chapter at Alfaisal University.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

type FormState = {
  full_name: string;
  email: string;
  student_id: string;
  isaca_id: string;
  college: string;
  program: string;
  program_other: string;
  year_of_study: string;
  preferred_team: string;
  preferred_role: string;
  phone: string;
  reason: string;
  interview_slot: string;
};

const EMPTY: FormState = {
  full_name: "",
  email: "",
  student_id: "",
  isaca_id: "",
  college: "",
  program: "",
  program_other: "",
  year_of_study: "",
  preferred_team: "",
  preferred_role: "",
  phone: "",
  reason: "",
  interview_slot: "",
};

const MEMBER_BENEFITS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: FileText,
    title: "CV building",
    description:
      "Activities and roles you can put on your CV and actually talk about in interviews.",
  },
  {
    icon: BadgeCheck,
    title: "Certification exposure",
    description:
      "Guidance on ISACA certifications including COBIT, plus the paths into CISA and CISM.",
  },
  {
    icon: TicketPercent,
    title: "Training & conference discounts",
    description: "Member discounts on a range of ISACA training courses and conferences.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Who can join?",
    a: "Any Alfaisal University student, from any college. You will need your student ID and an email ending in @alfaisal.edu.",
  },
  {
    q: "Is this the same as the ISACA Riyadh Chapter?",
    a: "No. The Alfaisal chapter is the student community on campus; the Riyadh chapter is the professional body for the city. They are independent, so you can join either or both.",
  },
  {
    q: "Do I have to pick a team or role?",
    a: "No. Both are optional. Choose “Not sure yet” and decide once you have met everyone — you can always tell us later.",
  },
  {
    q: "What happens if I apply for a Director or Associate Director role?",
    a: "You pick a 10-minute online interview slot on this form (Riyadh time). We send the meeting link closer to the date. Everyone else is done once the form is submitted.",
  },
  {
    q: "What do you do with my details?",
    a: "We only use them to contact you about the chapter. No spam.",
  },
];

/** Required fields for the completion meter, in form order. */
function requiredKeys(form: FormState, leadershipSlotRequired: boolean): (keyof FormState)[] {
  const keys: (keyof FormState)[] = [
    "full_name",
    "email",
    "student_id",
    "college",
    "program",
    "year_of_study",
  ];
  if (form.program === OTHER) keys.push("program_other");
  if (leadershipSlotRequired) keys.push("interview_slot");
  return keys;
}

function JoinPage() {
  const search = Route.useSearch();
  const submit = useServerFn(submitSignup);
  const takenSlotsFn = useServerFn(getTakenInterviewSlots);

  // Prefill team/role from ?team=&role= (e.g. "Apply for this role" links),
  // but only with values the form would accept.
  const [form, setForm] = useState<FormState>(() => {
    const team = search.team && TEAM_OPTIONS.includes(search.team) ? search.team : "";
    const role = team && search.role && rolesForTeam(team).includes(search.role) ? search.role : "";
    return { ...EMPTY, preferred_team: team, preferred_role: role };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState<string>("");
  const [pendingDate, setPendingDate] = useState<string>("");

  // Booked interview slots (timestamps only) so taken ones can be disabled.
  const { data: takenSlotsData } = useQuery({
    queryKey: ["taken-interview-slots"],
    queryFn: () => takenSlotsFn(),
    staleTime: 30_000,
  });
  const takenSlots = new Set<string>(takenSlotsData?.slots ?? []);

  // Computed after mount so the server-rendered and browser lists agree,
  // and refreshed periodically so passed times drop off on their own.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dates = useMemo(() => (now === null ? [] : upcomingDates(now)), [now]);

  const leadership = isLeadershipRole(form.preferred_role);
  const slotsReady = now !== null;
  const slotsClosed = slotsReady && bookingClosed(now);

  // Drop a selection (or open date) that has since passed.
  useEffect(() => {
    if (now === null) return;
    if (pendingDate && !dates.some((d) => d.date === pendingDate)) {
      setPendingDate("");
    }
    if (
      form.interview_slot &&
      !slotsForDate(form.interview_slot.slice(0, 10)).some((s) => s.iso === form.interview_slot)
    ) {
      setForm((f) => ({ ...f, interview_slot: "" }));
    }
  }, [now, dates, pendingDate, form.interview_slot]);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  const required = requiredKeys(form, leadership && slotsReady && !slotsClosed);
  const filled = required.filter((k) => form[k].trim() !== "").length;
  const pct = Math.round((filled / required.length) * 100);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const next: Record<string, string> = {};

    if (!form.email.trim().toLowerCase().endsWith("@alfaisal.edu")) {
      next["email"] = "Please use your Alfaisal email address (ending in @alfaisal.edu).";
    }

    if (!/^(\d{6}|\d{9})$/.test(form.student_id.trim())) {
      next["student_id"] = "Student ID must be 6 or 9 digits.";
    }

    if (form.isaca_id.trim() && !/^2\d{6}$/.test(form.isaca_id.trim())) {
      next["isaca_id"] = "ISACA ID must be a 7-digit code starting with 2.";
    }

    if (!form.college) next["college"] = "Please select your college.";
    if (!form.program) next["program"] = "Please select your program.";
    if (form.program === OTHER && !form.program_other.trim()) {
      next["program_other"] = "Please type your program.";
    }
    if (!form.year_of_study) {
      next["year_of_study"] = "Please select your year of study.";
    }

    if (leadership && !slotsClosed) {
      if (!form.interview_slot) {
        next["interview_slot"] = "Please pick an available interview slot.";
      } else if (takenSlots.has(form.interview_slot)) {
        next["interview_slot"] = "That slot was just taken — please pick another.";
      }
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      await submit({ data: form });
      setConfirmedSlot(leadership && form.interview_slot ? form.interview_slot : "");
      setDone(true);
      setForm({ ...EMPTY });
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Something went wrong. Please try again.";
      // A taken-slot race surfaces here from the unique index; point back at
      // the picker so the applicant can choose another time.
      if (/slot was just taken/i.test(message)) {
        setErrors((e) => ({ ...e, interview_slot: message }));
      } else {
        toast.error("Could not submit", { description: message });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Join Us"
        title={
          <>
            Become a <span className="text-gradient">member</span>
          </>
        }
        lead="Open to any Alfaisal student interested in IT governance, risk, cybersecurity, and audit. Fill out the form and we will be in touch."
        className="pb-10 sm:pb-12 md:pb-14"
      >
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/80">
          Joining the Alfaisal chapter is how you get into the student community here. You can also
          join the wider{" "}
          <a
            href={SITE.riyadhChapterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            ISACA Riyadh Chapter
          </a>{" "}
          separately. They are independent, so you can join either or both.
        </p>
      </PageHero>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <p className="eyebrow">What you get</p>
              <ul className="mt-4 flex flex-col gap-3">
                {MEMBER_BENEFITS.map(({ icon: Icon, title, description }) => (
                  <li
                    key={title}
                    className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-teal/12 text-brand-teal ring-1 ring-brand-teal/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.1} className="mt-10">
              <p className="eyebrow">Questions</p>
              <Accordion type="single" collapsible className="mt-2">
                {FAQ.map((item, i) => (
                  <AccordionItem key={item.q} value={`faq-${i}`} className="border-white/10">
                    <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </aside>

          {/* Form */}
          <Reveal delay={0.05}>
            {done ? (
              <div className="glass-strong rounded-3xl p-8 text-center sm:p-12">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-linear-to-br from-brand-teal to-brand-green text-navy-deep shadow-lg shadow-brand-teal/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-bold sm:text-3xl">
                  Thanks, we will be in touch
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Your sign-up was received. The chapter team will reach out with next steps soon.
                </p>
                {confirmedSlot && (
                  <p className="mt-5 rounded-xl border border-brand-teal/25 bg-brand-teal/8 p-4 text-sm">
                    <span className="font-semibold">Your interview slot:</span>{" "}
                    {labelSlotRangeISO(confirmedSlot)}. We will send the online meeting link closer
                    to the date.
                  </p>
                )}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setDone(false)}
                  >
                    Submit another response
                  </Button>
                  <Link to="/events" className="btn btn-ghost btn-sm">
                    See what we are planning
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="glass-strong rounded-3xl p-6 sm:p-8" noValidate>
                <div className="mb-7 flex items-start justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <p className="eyebrow">Application</p>
                    <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">
                      Membership form
                    </h2>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs text-muted-foreground">
                      {filled}/{required.length} required
                    </p>
                    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-linear-to-r from-brand-teal to-brand-green"
                        initial={false}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 200, damping: 30 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5">
                  <Field label="Full name" required error={errors["full_name"]}>
                    <Input
                      value={form.full_name}
                      onChange={(e) => update("full_name", e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                    />
                  </Field>

                  <Field label="Email" required error={errors["email"]}>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@alfaisal.edu"
                      autoComplete="email"
                      required
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Student ID"
                      required
                      error={errors["student_id"]}
                      hint="6 or 9 digits"
                    >
                      <Input
                        value={form.student_id}
                        onChange={(e) => update("student_id", e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 202412345"
                        inputMode="numeric"
                        maxLength={9}
                        required
                      />
                    </Field>

                    <Field label="ISACA ID" error={errors["isaca_id"]} hint="Optional">
                      <Input
                        value={form.isaca_id}
                        onChange={(e) => update("isaca_id", e.target.value)}
                        placeholder="e.g. 2001234"
                        inputMode="numeric"
                        maxLength={7}
                        autoComplete="off"
                      />
                    </Field>
                  </div>

                  <Field label="Phone number" error={errors["phone"]} hint="Optional">
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+966 5x xxx xxxx"
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label="College" required error={errors["college"]}>
                    <Select
                      value={form.college}
                      onValueChange={(v) => {
                        setForm((f) => ({
                          ...f,
                          college: v,
                          program: "",
                          program_other: "",
                        }));
                        setErrors((e) => ({ ...e, college: "", program: "" }));
                      }}
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue className="truncate" placeholder="Select your college" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLEGE_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Program" required error={errors["program"]}>
                    <Select
                      value={form.program}
                      onValueChange={(v) => update("program", v)}
                      disabled={!form.college}
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue
                          className="truncate"
                          placeholder={
                            form.college ? "Select your program" : "Select a college first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(form.college ? COLLEGES[form.college as CollegeName] : []).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {form.program === OTHER ? (
                    <Field
                      label="Please specify your program"
                      required
                      error={errors["program_other"]}
                    >
                      <Input
                        value={form.program_other}
                        onChange={(e) => update("program_other", e.target.value)}
                        placeholder="Type your program"
                        required
                      />
                    </Field>
                  ) : null}

                  <Field label="Year of study" required error={errors["year_of_study"]}>
                    <Select
                      value={form.year_of_study}
                      onValueChange={(v) => update("year_of_study", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEAR_OPTIONS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="mt-2 flex items-center gap-4">
                    <span className="font-mono text-[11px] tracking-[0.2em] text-brand-teal uppercase">
                      Your place in the team
                    </span>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>

                  <Field
                    label="Which team interests you?"
                    error={errors["preferred_team"]}
                    hint="Optional"
                  >
                    <Select
                      value={form.preferred_team}
                      onValueChange={(v) => {
                        setForm((f) => ({
                          ...f,
                          preferred_team: v,
                          preferred_role: "",
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue className="truncate" placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field
                    label="Which role interests you?"
                    error={errors["preferred_role"]}
                    hint="Optional"
                  >
                    <Select
                      value={form.preferred_role}
                      onValueChange={(v) => update("preferred_role", v)}
                      disabled={rolesForTeam(form.preferred_team).length === 0}
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue
                          className="truncate"
                          placeholder={
                            rolesForTeam(form.preferred_team).length > 0
                              ? "Select a role"
                              : "Select a team first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesForTeam(form.preferred_team).map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <p className="-mt-2 text-xs text-muted-foreground">
                    Not sure what these roles involve?{" "}
                    <Link
                      to="/team"
                      className="font-medium text-brand-teal underline-offset-4 hover:underline"
                    >
                      See the team page
                    </Link>
                    .
                  </p>

                  {leadership && slotsReady && !slotsClosed && (
                    <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/[0.06] p-4 sm:p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-display text-base font-semibold">
                          Pick your interview slot
                        </h3>
                        <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                          Online · Riyadh (GMT+3) · closes Sep 30
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Director and Associate Director applicants meet the team online for a short
                        chat. Choose a date, then an available time. Each slot is a 10-minute
                        window.
                      </p>

                      {errors["interview_slot"] && (
                        <p className="mt-3 text-xs font-medium text-destructive">
                          {errors["interview_slot"]}
                        </p>
                      )}

                      <div className="mt-4">
                        <p className="text-sm font-medium">1. Choose a date</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {dates.map((d) => {
                            const selected = pendingDate === d.date;
                            const dayNum = d.date.slice(8);
                            return (
                              <button
                                key={d.date}
                                type="button"
                                onClick={() => {
                                  setPendingDate(d.date);
                                  if (
                                    !form.interview_slot ||
                                    form.interview_slot.slice(0, 10) !== d.date
                                  ) {
                                    update("interview_slot", "");
                                  }
                                }}
                                className={cn(
                                  "flex min-w-[4.5rem] flex-col items-center rounded-xl border px-3 py-2 text-center transition",
                                  selected
                                    ? "border-brand-teal bg-brand-teal text-navy-deep"
                                    : "border-white/10 bg-white/[0.03] hover:border-brand-teal/60 hover:bg-brand-teal/10",
                                )}
                              >
                                <span className="text-xs font-semibold tracking-wide uppercase">
                                  {d.weekday}
                                </span>
                                <span className="font-display text-lg leading-tight font-bold">
                                  {dayNum}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {pendingDate && (
                        <div className="mt-5">
                          <p className="text-sm font-medium">2. Choose a time (10-minute slots)</p>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                            {slotsForDate(pendingDate).map((slot) => {
                              const taken = takenSlots.has(slot.iso);
                              const selected = form.interview_slot === slot.iso;
                              return (
                                <button
                                  key={slot.iso}
                                  type="button"
                                  disabled={taken}
                                  onClick={() => update("interview_slot", slot.iso)}
                                  className={cn(
                                    "rounded-lg border px-2 py-2 text-center text-xs leading-tight font-medium transition",
                                    selected
                                      ? "border-brand-teal bg-brand-teal text-navy-deep"
                                      : taken
                                        ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-muted-foreground/50 line-through"
                                        : "border-white/10 bg-white/[0.03] hover:border-brand-teal/60 hover:bg-brand-teal/10",
                                  )}
                                >
                                  {slot.timeRange}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {form.interview_slot && (
                        <p className="mt-4 text-sm">
                          <span className="font-semibold">Selected:</span>{" "}
                          {labelSlotRangeISO(form.interview_slot)}
                        </p>
                      )}
                    </div>
                  )}

                  {leadership && slotsReady && slotsClosed && (
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
                      Interview booking has closed. Submit your application and the team will
                      contact you to arrange a time.
                    </p>
                  )}

                  <Field
                    label="Why do you want to join?"
                    error={errors["reason"]}
                    hint="Optional. Helps us plan sessions around your interests"
                  >
                    <Textarea
                      value={form.reason}
                      onChange={(e) => update("reason", e.target.value)}
                      placeholder="What interests you about ISACA, governance, risk, cybersecurity, or audit?"
                      rows={4}
                    />
                  </Field>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
                  <p className="text-xs text-muted-foreground">
                    We only use this to contact you about the chapter. No spam.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary disabled:pointer-events-none disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="relative h-4 w-4 animate-spin" />
                        <span className="relative">Submitting…</span>
                      </>
                    ) : (
                      <>
                        <span className="relative">Submit application</span>
                        <ArrowRight className="relative h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-brand-teal"> *</span> : null}
        </Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
