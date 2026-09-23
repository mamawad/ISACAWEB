import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MiniUser } from "@/lib/pm/permissions";
import { Avatar } from "./avatar";

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
          {required ? <span className="text-primary"> *</span> : null}
        </Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

export type Option = { value: string; label: string; hint?: string | undefined };

/** Thin wrapper over shadcn Select with a plain options array. */
export function SelectField({
  value,
  onChange,
  options,
  placeholder = "",
  disabled,
  className,
  allowEmpty,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean | undefined;
  className?: string | undefined;
  /** Adds a first option that clears the value. */
  allowEmpty?: string | undefined;
}) {
  const NONE = "__none__";
  return (
    <Select
      value={value || (allowEmpty ? NONE : "")}
      onValueChange={(v) => onChange(v === NONE ? "" : v)}
      disabled={disabled ?? false}
    >
      <SelectTrigger className={cn("w-full min-w-0 bg-surface text-foreground", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="manage-theme">
        {allowEmpty ? (
          <SelectItem value={NONE}>
            <span className="text-muted-foreground">{allowEmpty}</span>
          </SelectItem>
        ) : null}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
            {o.hint ? <span className="ml-2 text-xs text-muted-foreground">{o.hint}</span> : null}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Member picker with avatars. */
export function UserSelect({
  value,
  onChange,
  users,
  placeholder = "",
  disabled,
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  users: MiniUser[];
  placeholder?: string;
  disabled?: boolean | undefined;
  className?: string | undefined;
}) {
  const NONE = "__none__";
  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? null : v)}
      disabled={disabled ?? false}
    >
      <SelectTrigger className={cn("w-full min-w-0 bg-surface text-foreground", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="manage-theme">
        <SelectItem value={NONE}>
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Avatar user={null} size="xs" withTitle={false} />
            {placeholder}
          </span>
        </SelectItem>
        {users.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            <span className="inline-flex items-center gap-2">
              <Avatar user={u} size="xs" withTitle={false} />
              {u.display_name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const inputClass =
  "h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm font-medium text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = String((err as { message: unknown }).message);
    // Zod errors arrive as JSON arrays; surface the first message.
    if (m.startsWith("[")) {
      try {
        const parsed = JSON.parse(m) as { message?: string }[];
        return parsed[0]?.message ?? fallback;
      } catch {
        return m;
      }
    }
    return m;
  }
  return fallback;
}

export function formatDate(
  iso: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = {},
): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...opts });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}

export function formatBytes(n: number | null): string {
  if (n === null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
