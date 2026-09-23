import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldCheck,
  Loader2,
  Lock,
  Download,
  Trash2,
  Link as LinkIcon,
  MailWarning,
  MailCheck,
  Send,
  Copy,
  CalendarCheck,
  Users,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyFilters,
  EMPTY_FILTERS,
  SignupFilterPanel,
  uniqueEmails,
  type SignupFilters,
} from "@/components/admin/signup-filters";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteSignup,
  getLiveExportUrl,
  getInterviewerEmails,
  saveInterviewerEmails,
  getInviteConnectionStatus,
  sendInterviewInvites,
  listSignups,
  lockAdmin,
  resendSignupAlerts,
  unlockAdmin,
} from "@/lib/signups.functions";
import type { SignupRow } from "@/lib/signups.schema";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · ISACA Student Chapter, Alfaisal University" },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const list = useServerFn(listSignups);
  const unlock = useServerFn(unlockAdmin);
  const lock = useServerFn(lockAdmin);
  const remove = useServerFn(deleteSignup);
  const liveUrl = useServerFn(getLiveExportUrl);
  const resend = useServerFn(resendSignupAlerts);
  const fetchInterviewers = useServerFn(getInterviewerEmails);
  const persistInterviewers = useServerFn(saveInterviewerEmails);
  const inviteStatus = useServerFn(getInviteConnectionStatus);
  const sendInvites = useServerFn(sendInterviewInvites);
  const [password, setPassword] = useState("");
  const [signups, setSignups] = useState<SignupRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lockedMinutes, setLockedMinutes] = useState(0);
  const [checkedSession, setCheckedSession] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SignupRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendingAll, setResendingAll] = useState(false);

  const [filters, setFilters] = useState<SignupFilters>({ ...EMPTY_FILTERS });

  // Interview invites state
  const [interviewerEmails, setInterviewerEmails] = useState<string[]>([]);
  const [newInterviewer, setNewInterviewer] = useState("");
  const [interviewersLoaded, setInterviewersLoaded] = useState(false);
  const [savingInterviewers, setSavingInterviewers] = useState(false);
  const [inviteConnected, setInviteConnected] = useState<boolean | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitingAll, setInvitingAll] = useState(false);

  // Rows matching the current filter menu; all actions operate on these.
  const filtered = useMemo(() => applyFilters(signups ?? [], filters), [signups, filters]);
  const filteredEmailCount = useMemo(() => uniqueEmails(filtered).length, [filtered]);

  async function runResend(id?: string) {
    if (id) setResendingId(id);
    else setResendingAll(true);
    try {
      const res = await resend({ data: id ? { id } : {} });
      if (!res.ok) {
        toast.error("Session expired. Please sign in again.");
        return;
      }
      setSignups(res.signups);
      if (res.sent === 0 && res.failed === 0) {
        toast.message("Nothing to send, every application was already emailed.");
      } else if (res.failed === 0) {
        toast.success(`Sent ${res.sent} alert email${res.sent === 1 ? "" : "s"}.`);
      } else {
        toast.error(`Sent ${res.sent}, ${res.failed} still failed.`);
      }
    } catch {
      toast.error("Could not send right now. Please try again.");
    } finally {
      setResendingId(null);
      setResendingAll(false);
    }
  }

  async function addInterviewer() {
    const e = newInterviewer.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (interviewerEmails.includes(e)) {
      setNewInterviewer("");
      return;
    }
    const next = [...interviewerEmails, e];
    setInterviewerEmails(next);
    setNewInterviewer("");
    await saveInterviewers(next);
  }

  async function removeInterviewer(email: string) {
    const next = interviewerEmails.filter((x) => x !== email);
    setInterviewerEmails(next);
    await saveInterviewers(next);
  }

  async function saveInterviewers(emails: string[]) {
    setSavingInterviewers(true);
    try {
      const res = await persistInterviewers({ data: { emails } });
      if (!res.ok) {
        toast.error("Session expired. Please sign in again.");
        return;
      }
      setInterviewerEmails(res.emails);
    } catch {
      toast.error("Could not save interviewers right now.");
    } finally {
      setSavingInterviewers(false);
    }
  }

  async function runSendInvite(id?: string) {
    if (id) setInvitingId(id);
    else setInvitingAll(true);
    try {
      const res = await sendInvites({ data: id ? { id } : {} });
      if (!res.ok) {
        toast.error("Session expired. Please sign in again.");
        return;
      }
      setSignups(res.signups);
      if (res.sent === 0 && res.failed === 0) {
        toast.message("Nothing to send, every interview already has an invite.");
      } else if (res.failed === 0) {
        toast.success(
          `Sent ${res.sent} invite${res.sent === 1 ? "" : "s"}. Check Outlook to track RSVPs.`,
        );
      } else {
        toast.error(`Sent ${res.sent}, ${res.failed} failed. Is Microsoft still connected?`);
      }
    } catch {
      toast.error("Could not send the invite right now. Please try again.");
    } finally {
      setInvitingId(null);
      setInvitingAll(false);
    }
  }

  async function confirmDelete() {
    const target = pendingDelete;
    if (!target) return;
    setDeletingId(target.id);
    try {
      const res = await remove({ data: { id: target.id } });
      if (res.ok) {
        setSignups((rows) => (rows ?? []).filter((r) => r.id !== target.id));
        toast.success(`Deleted ${target.full_name}'s application.`);
      } else {
        toast.error("Session expired. Please sign in again.");
      }
    } catch {
      toast.error("Could not delete that entry. Please try again.");
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  // An existing session cookie keeps you signed in across refreshes.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await list();
        if (active && res.ok) setSignups(res.signups);
      } catch {
        /* stay locked */
      } finally {
        if (active) setCheckedSession(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [list]);

  // Once signed in, load the interviewer list and the Outlook connection status.
  useEffect(() => {
    if (!signups || interviewersLoaded) return;
    let active = true;
    void (async () => {
      try {
        const [emails, status] = await Promise.all([
          fetchInterviewers(),
          inviteStatus(),
        ]);
        if (!active) return;
        if (emails.ok) setInterviewerEmails(emails.emails);
        if (status.ok) setInviteConnected(status.connected);
      } catch {
        /* keep defaults */
      } finally {
        if (active) setInterviewersLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [signups, interviewersLoaded, fetchInterviewers, inviteStatus]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFailed(false);
    setLockedMinutes(0);
    try {
      const res = await unlock({ data: { password } });
      if (res.ok) {
        setSignups(res.signups);
        setPassword("");
      } else {
        setFailed(true);
        setLockedMinutes(res.lockedMinutes);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setSignups(null);
    setPassword("");
    setFailed(false);
    setLockedMinutes(0);
    try {
      await lock();
    } catch {
      /* cookie clears on expiry anyway */
    }
  }

  if (signups === null && !checkedSession) {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (signups === null) {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-16">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Chapter admin</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the admin password to view membership sign-ups.
            </p>
          </div>
          <form onSubmit={onLogin} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFailed(false);
                }}
                required
              />
              {failed ? (
                <p className="text-xs font-medium text-destructive">
                  {lockedMinutes > 0
                    ? `Too many failed attempts. Try again in ${lockedMinutes} minute${lockedMinutes === 1 ? "" : "s"}.`
                    : "Incorrect password. Please try again."}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking…
                </>
              ) : (
                "View sign-ups"
              )}
            </Button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Membership sign-ups
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {signups.length} {signups.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Download CSV ({filtered.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const emails = uniqueEmails(filtered);
              if (emails.length === 0) {
                toast.message("No sign-ups match the current filter.");
                return;
              }
              const joined = emails.join(", ");
              try {
                await navigator.clipboard.writeText(joined);
                toast.success(`Copied ${emails.length} email${emails.length === 1 ? "" : "s"}.`);
              } catch {
                toast.message("Couldn't copy automatically, see the list below.");
                setFeedUrl(joined);
              }
            }}
            disabled={filteredEmailCount === 0}
          >
            <Copy className="h-4 w-4" />
            Copy emails ({filteredEmailCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void runResend()}
            disabled={resendingAll || signups.every((s) => s.notified_at)}
          >
            {resendingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send missing alerts
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>
            <ShieldCheck className="h-4 w-4" />
            Lock
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5">
        <h2 className="text-sm font-semibold text-foreground">Live Excel feed</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          In Excel: Data → Get Data → From Web, paste this link, then set a refresh interval. The
          sheet updates itself as new people join. Keep the link private, anyone with it can read
          the sign-ups.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await liveUrl();
              if (!res.ok) {
                toast.error("Session expired. Please sign in again.");
                return;
              }
              setFeedUrl(res.url);
              try {
                await navigator.clipboard.writeText(res.url);
                toast.success("Live feed link copied.");
              } catch {
                toast.message("Link ready below.");
              }
            }}
          >
            <LinkIcon className="h-4 w-4" />
            {feedUrl ? "Copy link again" : "Show & copy link"}
          </Button>
          {feedUrl ? (
            <code className="max-w-full break-all rounded-md bg-background px-2 py-1 text-xs text-muted-foreground">
              {feedUrl}
            </code>
          ) : null}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Interview calendar invites
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void runSendInvite()}
            disabled={
              invitingAll ||
              inviteConnected === false ||
              !signups.some((s) => s.interview_slot && !s.invite_sent_at)
            }
          >
            {invitingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send all invites
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Clicking “Send invite” creates a real Teams meeting in the connected Outlook calendar
          and sends the applicant (plus everyone below) a calendar invite they can accept or
          decline. RSVPs show up in that Outlook calendar. This never runs automatically.
        </p>

        {inviteConnected === false ? (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            Microsoft Outlook isn’t connected yet. Connect it from the chat to enable invites.
          </p>
        ) : null}

        <div className="mt-3">
          <Label className="text-xs font-medium text-muted-foreground">
            Interviewer emails (added to every invite)
          </Label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {interviewerEmails.length === 0 ? (
              <span className="text-xs text-muted-foreground">None added yet.</span>
            ) : (
              interviewerEmails.map((e) => (
                <span
                  key={e}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs"
                >
                  {e}
                  <button
                    type="button"
                    aria-label={`Remove ${e}`}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={savingInterviewers}
                    onClick={() => void removeInterviewer(e)}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input
              type="email"
              placeholder="interviewer@example.com"
              value={newInterviewer}
              onChange={(e) => setNewInterviewer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addInterviewer();
                }
              }}
              className="h-9 max-w-xs"
              disabled={savingInterviewers}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => void addInterviewer()}
              disabled={savingInterviewers || !newInterviewer.trim()}
            >
              {savingInterviewers ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          The applicant is always included automatically.
        </p>
      </div>

      <SignupFilterPanel
        filters={filters}
        onChange={setFilters}
        shown={filtered.length}
        total={signups.length}
      />

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {signups.length === 0 ? "No sign-ups yet." : "No sign-ups match the current filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>ISACA ID</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Program</TableHead>

                  <TableHead>Year</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Interview</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Submitted</TableHead>
                   <TableHead>Emailed</TableHead>
                   <TableHead>Invite</TableHead>
                   <TableHead className="w-12">
                     <span className="sr-only">Actions</span>
                   </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-foreground">{s.full_name}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.email}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.student_id}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.isaca_id ?? "—"}</TableCell>
                    <TableCell>{s.college ?? "Not specified"}</TableCell>
                    <TableCell>{s.program ?? s.major}</TableCell>

                    <TableCell className="whitespace-nowrap">{s.year_of_study}</TableCell>
                    <TableCell>{s.preferred_team ?? "—"}</TableCell>
                    <TableCell>{s.preferred_role ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {s.interview_slot ? formatInterviewSlot(s.interview_slot) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{s.phone ?? "—"}</TableCell>
                    <TableCell className="max-w-xs">
                      {s.reason ? <span className="line-clamp-3">{s.reason}</span> : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.notified_at ? (
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <MailCheck className="h-4 w-4 text-primary" />
                          Sent
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void runResend(s.id)}
                          disabled={resendingId === s.id}
                        >
                          {resendingId === s.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MailWarning className="h-4 w-4 text-destructive" />
                          )}
                          Send
                        </Button>
                       )}
                     </TableCell>
                     <TableCell className="whitespace-nowrap">
                       {!s.interview_slot ? (
                         <span className="text-sm text-muted-foreground">—</span>
                       ) : s.invite_sent_at ? (
                         <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                           <CalendarCheck className="h-4 w-4 text-primary" />
                           Sent
                         </span>
                       ) : (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => void runSendInvite(s.id)}
                           disabled={invitingId === s.id || inviteConnected === false}
                           title={
                             inviteConnected === false
                               ? "Connect Microsoft Outlook first."
                               : "Create a Teams invite the applicant can RSVP."
                           }
                         >
                           {invitingId === s.id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <CalendarCheck className="h-4 w-4" />
                           )}
                           Send
                         </Button>
                       )}
                     </TableCell>
                     <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${s.full_name}'s application`}
                        disabled={deletingId === s.id}
                        onClick={() => setPendingDelete(s)}
                      >
                        {deletingId === s.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">{pendingDelete?.full_name}</span> (
              {pendingDelete?.email}) from the sign-ups. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deletingId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

const CSV_COLUMNS: { header: string; value: (s: SignupRow) => string }[] = [
  { header: "Name", value: (s) => s.full_name },
  { header: "Email", value: (s) => s.email },
  { header: "Student ID", value: (s) => s.student_id },
  { header: "ISACA ID", value: (s) => s.isaca_id ?? "" },
  { header: "College", value: (s) => s.college ?? "" },
  { header: "Program", value: (s) => s.program ?? s.major },
  { header: "Year", value: (s) => s.year_of_study },
  { header: "Team", value: (s) => s.preferred_team ?? "" },
  { header: "Role", value: (s) => s.preferred_role ?? "" },
  {
    header: "Interview",
    value: (s) => (s.interview_slot ? formatInterviewSlot(s.interview_slot) : ""),
  },
  { header: "Phone", value: (s) => s.phone ?? "" },
  { header: "Reason", value: (s) => s.reason ?? "" },
  { header: "Submitted", value: (s) => new Date(s.created_at).toISOString() },
];

/** Format a stored interview slot ISO timestamp as a readable Riyadh-time string. */
function formatInterviewSlot(iso: string): string {
  try {
    // Stored as UTC; Riyadh is UTC+3.
    const d = new Date(iso);
    const riyadh = new Date(d.getTime() + 180 * 60_000);
    const weekday = riyadh.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    });
    const day = riyadh.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    const time = riyadh.toISOString().slice(11, 16);
    return `${weekday} ${day}, ${time} (Riyadh)`;
  } catch {
    return iso;
  }
}

/** RFC 4180 escaping so commas, quotes and newlines survive Excel. */
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadCsv(rows: SignupRow[]) {
  const lines = [
    CSV_COLUMNS.map((c) => csvCell(c.header)).join(","),
    ...rows.map((row) => CSV_COLUMNS.map((c) => csvCell(c.value(row))).join(",")),
  ];
  // BOM keeps Excel happy with non-ASCII names.
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `isaca-signups-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
