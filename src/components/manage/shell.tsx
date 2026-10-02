import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarClock,
  ChevronDown,
  CheckSquare2,
  Command as CommandIcon,
  Eye,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { manageLogout, stopImpersonating } from "@/lib/pm/auth.functions";
import { listProjects } from "@/lib/pm/projects.functions";
import { INTERVIEW_TRACKS } from "@/lib/pm/interview-teams";
import { useCan, useManage } from "./manage-context";
import { Avatar } from "./avatar";
import { CommandPalette } from "./command-palette";

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean; show?: boolean };

function SidebarInterviews({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(pathname.startsWith("/manage/interviews"));
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          pathname.startsWith("/manage/interviews")
            ? "text-primary"
            : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground",
        )}
      >
        <CalendarClock className="h-4 w-4" />
        <span>Interviews</span>
        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-black/10 pl-2">
          <Link
            to="/manage/interviews"
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/manage/interviews"
                ? "bg-black/[0.05] text-foreground"
                : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground",
            )}
          >
            All interviews
          </Link>
          {INTERVIEW_TRACKS.map((t) => {
            const active = pathname === `/manage/interviews/${t.slug}`;
            return (
              <Link
                key={t.slug}
                to="/manage/interviews/$track"
                params={{ track: t.slug }}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-black/[0.05] text-foreground"
                    : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground",
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: t.color }}
                />
                <span className="truncate">{t.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function InterviewsSection({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const can = useCan();
  if (!can("interviews.view")) return null;
  return (
    <div className="mt-0.5">
      <SidebarInterviews onNavigate={onNavigate} />
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const can = useCan();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: NavItem[] = [
    { to: "/manage", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/manage/tasks", label: "My work", icon: CheckSquare2 },
    { to: "/manage/projects", label: "Projects", icon: FolderKanban },
    { to: "/manage/people", label: "People", icon: Users, show: can("people.view") },
    { to: "/manage/roles", label: "Roles & access", icon: ShieldCheck, show: can("roles.manage") },
  ];
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Workspace">
      {items
        .filter((i) => i.show !== false)
        .map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="manage-nav-active"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/15"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}

function SidebarProjects({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const can = useCan();
  const { data } = useQuery({
    queryKey: ["pm", "projects", false],
    queryFn: () => listProjects({ data: {} }),
    staleTime: 30_000,
  });
  const projects = data?.projects ?? [];
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between px-3">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Projects
        </p>
        {can("projects.create") ? (
          <Link
            to="/manage/projects"
            search={{ create: true }}
            onClick={onNavigate}
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-black/[0.05] hover:text-foreground"
            aria-label="New project"
          >
            <Plus className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        {projects.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No projects yet.</p>
        ) : null}
        {projects.map((p) => {
          const active = pathname.startsWith(`/manage/projects/${p.key}`);
          return (
            <Link
              key={p.id}
              to="/manage/projects/$key"
              params={{ key: p.key }}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-black/[0.05] text-foreground"
                  : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground",
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: p.color }}
              />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{p.key}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/manage" className="flex items-center gap-3 px-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <img src="/brand/isaca-square.png" alt="" className="h-7 w-7 object-contain" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold">ISACA Alfaisal</span>
        <span className="block font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          Workspace
        </span>
      </span>
    </Link>
  );
}

function UserMenu() {
  const ctx = useManage();
  const router = useRouter();
  const navigate = useNavigate();
  async function signOut() {
    await manageLogout();
    await router.invalidate();
    navigate({ to: "/manage/login" });
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-black/[0.04]"
        >
          <Avatar user={ctx.user} size="md" withTitle={false} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold">{ctx.user.display_name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {ctx.user.is_admin ? "Administrator" : (ctx.user.role_name ?? "No role")}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="manage-theme w-56">
        <DropdownMenuLabel className="font-mono text-xs">@{ctx.user.username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/manage/profile">
            <UserRound className="mr-2 h-4 w-4" /> Profile & password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ImpersonationBanner() {
  const ctx = useManage();
  const router = useRouter();
  const navigate = useNavigate();
  if (!ctx.impersonator) return null;
  async function stop() {
    try {
      await stopImpersonating();
      await router.invalidate();
      navigate({ to: "/manage/people" });
    } catch (err) {
      toast.error("Could not stop viewing", { description: String(err) });
    }
  }
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-950"
    >
      <Eye className="h-4 w-4" />
      Viewing as <strong>{ctx.user.display_name}</strong> — this is exactly what they see.
      <button
        type="button"
        onClick={() => void stop()}
        className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-900"
      >
        <X className="h-3 w-3" /> Back to {ctx.impersonator.display_name}
      </button>
    </motion.div>
  );
}

/** Workspace frame: fixed sidebar, top bar, content area, command palette. */
export function ManageShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="pt-1">
        <Brand />
      </div>
      <div className="mt-6 px-1">
        <SidebarNav onNavigate={onNavigate} />
        <InterviewsSection onNavigate={onNavigate} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1">
        <SidebarProjects onNavigate={onNavigate} />
      </div>
      <div className="border-t border-black/5 p-2">
        <UserMenu />
      </div>
    </div>
  );

  return (
    <div className="manage-paper flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/5 bg-sidebar p-3 lg:flex">
        {sidebar()}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <ImpersonationBanner />
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-black/5 bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg hover:bg-black/[0.05] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <SheetContent side="left" className="manage-theme w-72 bg-sidebar p-3 text-foreground">
              <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
              {sidebar(() => setMenuOpen(false))}
            </SheetContent>
          </Sheet>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-black/8 bg-white px-3 text-sm text-muted-foreground shadow-sm transition hover:border-primary/40 sm:max-w-md"
          >
            <CommandIcon className="h-4 w-4" />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="hidden rounded border border-black/10 bg-muted px-1.5 font-mono text-[10px] sm:inline">
              Ctrl K
            </kbd>
          </button>

          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Link
              to="/manage/projects"
              search={{ create: true }}
              className="btn btn-primary btn-sm"
            >
              <Plus className="relative h-4 w-4" />
              <span className="relative">New project</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname.split("/").slice(0, 4).join("/")}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              {...(reduce ? {} : { exit: { opacity: 0, y: -6 } })}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-7xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string | undefined;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
}) {
  return (
    <div className="card-glow flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
