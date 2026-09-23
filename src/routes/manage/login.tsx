import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { manageLogin } from "@/lib/pm/auth.functions";
import { errorMessage, inputClass } from "@/components/manage/fields";
import { cn } from "@/lib/utils";
import { NationalDayRibbon } from "@/components/national-day/ribbon";
import { useNationalDay } from "@/components/national-day/use-national-day";

type LoginSearch = { next?: string };

export const Route = createFileRoute("/manage/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const next = search["next"];
    return typeof next === "string" && next.startsWith("/manage") ? { next } : {};
  },
  head: () => ({ meta: [{ title: "Sign in · ISACA Alfaisal workspace" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const reduce = useReducedMotion();
  const { active: nationalDay } = useNationalDay();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await manageLogin({ data: { username, password, remember } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await router.invalidate();
      const mustChange = res.context?.user.must_change_password;
      if (mustChange) {
        navigate({ to: "/manage/profile", search: { change: true } });
      } else {
        navigate({ to: (next ?? "/manage") as "/manage" });
      }
    } catch (err) {
      setError(errorMessage(err, "Could not sign in. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="manage-paper relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      {nationalDay ? <NationalDayRibbon compact className="absolute inset-x-0 top-0 z-10" /> : null}
      <div className="aurora" aria-hidden="true">
        <span style={{ opacity: 0.35 }} />
        <span style={{ opacity: 0.3 }} />
        <span style={{ opacity: 0.25 }} />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-md ring-1 ring-black/5">
            <img src="/brand/isaca-square.png" alt="" className="h-8 w-8 object-contain" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-base font-bold">ISACA Alfaisal</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Chapter workspace
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="glass-strong rounded-3xl p-7 shadow-xl shadow-violet-900/5 sm:p-8"
          noValidate
        >
          <p className="eyebrow">Sign in</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the username and password the chapter gave you.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Username
              </span>
              <input
                className={inputClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Password
              </span>
              <span className="relative">
                <input
                  className={cn(inputClass, "pr-11")}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-black/5"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 accent-[var(--primary)]"
              />
              Keep me signed in on this device for 30 days
            </label>

            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive"
              >
                {error}
              </motion.p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary mt-1 w-full disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="relative h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="relative h-4 w-4" />
              )}
              <span className="relative">{busy ? "Signing in…" : "Sign in"}</span>
              {!busy ? <ArrowRight className="relative h-4 w-4" /> : null}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Your browser can save this password when you sign in. Lost access? Ask a chapter
          administrator to reset it.
        </p>
      </motion.div>
    </div>
  );
}
