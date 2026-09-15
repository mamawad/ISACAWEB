import { useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { changeMyPassword } from "@/lib/pm/auth.functions";
import { PERMISSIONS, PERMISSION_GROUPS, hasPermission } from "@/lib/pm/permissions";
import { useManage } from "@/components/manage/manage-context";
import { PageHeader } from "@/components/manage/shell";
import { Avatar } from "@/components/manage/avatar";
import { Field, errorMessage, inputClass } from "@/components/manage/fields";
import { cn } from "@/lib/utils";

type ProfileSearch = { change?: boolean };

export const Route = createFileRoute("/manage/profile")({
  validateSearch: (search: Record<string, unknown>): ProfileSearch =>
    search["change"] === true || search["change"] === "true" ? { change: true } : {},
  head: () => ({ meta: [{ title: "Profile · ISACA Alfaisal workspace" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const ctx = useManage();
  const { change } = Route.useSearch();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await changeMyPassword({ data: { current, next } });
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
      await router.invalidate();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title="Your account"
        description="Who you are in the workspace, and what you can do."
      />

      {ctx.user.must_change_password || change ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <strong>Set a new password.</strong> The one you signed in with was set by an
          administrator — choose your own below.
        </motion.div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-6">
          <div className="card-glow p-6">
            <div className="flex items-center gap-4">
              <Avatar user={ctx.user} size="xl" withTitle={false} />
              <div>
                <p className="font-display text-lg font-bold">{ctx.user.display_name}</p>
                <p className="font-mono text-xs text-muted-foreground">@{ctx.user.username}</p>
                {ctx.user.email ? (
                  <p className="mt-1 text-sm text-muted-foreground">{ctx.user.email}</p>
                ) : null}
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-muted/60 p-3">
                <dt className="text-xs text-muted-foreground">Role</dt>
                <dd className="mt-0.5 font-semibold">
                  {ctx.user.is_admin ? "Administrator" : (ctx.user.role_name ?? "No role")}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <dt className="text-xs text-muted-foreground">Member since</dt>
                <dd className="mt-0.5 font-semibold">
                  {new Date(ctx.user.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card-glow p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">What you can do</h2>
            </div>
            {ctx.user.is_admin ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Administrators can do everything in the workspace.
              </p>
            ) : (
              <div className="mt-4 grid gap-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group}>
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      {group}
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {PERMISSIONS.filter((p) => p.group === group).map((p) => {
                        const on = hasPermission(ctx, p.key);
                        return (
                          <li
                            key={p.key}
                            title={p.description}
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs",
                              on
                                ? "bg-primary/10 font-semibold text-primary"
                                : "bg-muted text-muted-foreground line-through",
                            )}
                          >
                            {p.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Project leads can also manage members and every task inside their own projects.
                </p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={submit} className="card-glow h-fit p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-semibold">Change password</h2>
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Current password" required>
              <input
                className={inputClass}
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Field label="New password" required hint="8+ chars, letters and numbers">
              <input
                className={inputClass}
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
            <Field label="Confirm new password" required>
              <input
                className={inputClass}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary btn-sm justify-self-start disabled:opacity-60"
            >
              {busy ? <Loader2 className="relative h-4 w-4 animate-spin" /> : null}
              <span className="relative">Update password</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
