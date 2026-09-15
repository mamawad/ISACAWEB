import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials, type MiniUser } from "@/lib/pm/permissions";

const SIZES = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-lg",
} as const;

type AvatarProps = {
  user: MiniUser | null | undefined;
  size?: keyof typeof SIZES;
  className?: string | undefined;
  /** Shown as a tooltip via title. */
  withTitle?: boolean;
};

/** Initials on the member's colour. Null renders an "unassigned" placeholder. */
export function Avatar({ user, size = "md", className, withTitle = true }: AvatarProps) {
  if (!user) {
    return (
      <span
        title={withTitle ? "Unassigned" : undefined}
        className={cn(
          "grid shrink-0 place-items-center rounded-full border border-dashed border-foreground/25 text-muted-foreground",
          SIZES[size],
          className,
        )}
      >
        <UserRound className="h-[55%] w-[55%]" />
      </span>
    );
  }
  return (
    <span
      title={withTitle ? user.display_name : undefined}
      style={{ backgroundColor: user.avatar_color }}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-display font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]",
        SIZES[size],
        className,
      )}
    >
      {initials(user.display_name)}
    </span>
  );
}

/** Overlapping row of avatars with a +N overflow chip. */
export function AvatarStack({
  users,
  max = 4,
  size = "sm",
}: {
  users: MiniUser[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <span className="flex -space-x-2">
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} className="ring-2 ring-background" />
      ))}
      {rest > 0 ? (
        <span
          className={cn(
            "grid place-items-center rounded-full bg-muted font-mono text-muted-foreground ring-2 ring-background",
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      ) : null}
    </span>
  );
}
