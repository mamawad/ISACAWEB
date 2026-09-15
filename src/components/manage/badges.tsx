import {
  Bookmark,
  BookOpen,
  Bug,
  CheckSquare2,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Equal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROJECT_ACCESS,
  statusMeta,
  type ProjectAccess,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/lib/pm/permissions";

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string | undefined;
}) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        className,
      )}
      style={{
        color: meta.hue,
        borderColor: `color-mix(in oklab, ${meta.hue} 35%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${meta.hue} 10%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.hue }} />
      {meta.label}
    </span>
  );
}

const PRIORITY_ICON: Record<TaskPriority, { icon: LucideIcon; className: string; label: string }> =
  {
    highest: { icon: ChevronsUp, className: "text-red-600", label: "Highest" },
    high: { icon: ChevronUp, className: "text-orange-500", label: "High" },
    medium: { icon: Equal, className: "text-amber-500", label: "Medium" },
    low: { icon: ChevronDown, className: "text-sky-600", label: "Low" },
    lowest: { icon: ChevronsDown, className: "text-slate-400", label: "Lowest" },
  };

export function PriorityIcon({
  priority,
  className,
  withLabel = false,
}: {
  priority: TaskPriority;
  className?: string | undefined;
  withLabel?: boolean;
}) {
  const p = PRIORITY_ICON[priority];
  const Icon = p.icon;
  return (
    <span
      title={p.label}
      className={cn("inline-flex items-center gap-1 text-xs font-medium", p.className, className)}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {withLabel ? p.label : null}
    </span>
  );
}

const TYPE_ICON: Record<TaskType, { icon: LucideIcon; className: string; label: string }> = {
  epic: { icon: Bookmark, className: "bg-violet-600", label: "Epic" },
  story: { icon: BookOpen, className: "bg-emerald-600", label: "Story" },
  task: { icon: CheckSquare2, className: "bg-sky-600", label: "Task" },
  bug: { icon: Bug, className: "bg-rose-600", label: "Bug" },
};

export function TypeIcon({
  type,
  size = "sm",
  className,
}: {
  type: TaskType;
  size?: "xs" | "sm";
  className?: string | undefined;
}) {
  const t = TYPE_ICON[type];
  const Icon = t.icon;
  return (
    <span
      title={t.label}
      className={cn(
        "grid shrink-0 place-items-center rounded text-white",
        size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4",
        t.className,
        className,
      )}
    >
      <Icon className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} strokeWidth={2.5} />
    </span>
  );
}

export function AccessBadge({ access }: { access: ProjectAccess | null }) {
  if (!access) return <span className="text-xs text-muted-foreground">—</span>;
  const meta = PROJECT_ACCESS.find((a) => a.key === access);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
        access === "lead" && "bg-violet-100 text-violet-800",
        access === "editor" && "bg-sky-100 text-sky-800",
        access === "member" && "bg-emerald-100 text-emerald-800",
        access === "viewer" && "bg-slate-100 text-slate-700",
      )}
    >
      {meta?.label ?? access}
    </span>
  );
}

export function KeyChip({
  children,
  className,
}: {
  children: string;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
