import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Copy,
  Eye,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createUser,
  deleteUser,
  listPeople,
  resetUserPassword,
  updateUser,
} from "@/lib/pm/people.functions";
import { impersonateUser } from "@/lib/pm/auth.functions";
import { AVATAR_COLORS, type PmRole, type PmUser } from "@/lib/pm/permissions";
import { useCan, useManage } from "@/components/manage/manage-context";
import { EmptyState, PageHeader } from "@/components/manage/shell";
import { Avatar } from "@/components/manage/avatar";
import { Field, SelectField, errorMessage, inputClass, timeAgo } from "@/components/manage/fields";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manage/people")({
  head: () => ({ meta: [{ title: "People · ISACA Alfaisal workspace" }] }),
  component: PeoplePage,
});

function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("") + "!";
}

function PeoplePage() {
  const ctx = useManage();
  const can = useCan();
  const qc = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["pm", "people"], queryFn: () => listPeople() });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PmUser | null>(null);
  const [resetting, setResetting] = useState<PmUser | null>(null);
  const [q, setQ] = useState("");

  const users = (data?.users ?? []).filter((u) =>
    q
      ? `${u.display_name} ${u.username} ${u.email ?? ""}`.toLowerCase().includes(q.toLowerCase())
      : true,
  );
  const roles = data?.roles ?? [];
  const canManage = data?.canManage ?? false;

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["pm", "people"] });
  }

  async function viewAs(u: PmUser) {
    try {
      await impersonateUser({ data: { userId: u.id } });
      await router.invalidate();
      await qc.invalidateQueries({ queryKey: ["pm"] });
      navigate({ to: "/manage" });
    } catch (err) {
      toast.error("Could not view as member", { description: errorMessage(err) });
    }
  }
  async function toggleActive(u: PmUser) {
    try {
      await updateUser({ data: { id: u.id, is_active: !u.is_active } });
      await refresh();
      toast.success(u.is_active ? "Member deactivated" : "Member reactivated");
    } catch (err) {
      toast.error("Could not update", { description: errorMessage(err) });
    }
  }
  async function remove(u: PmUser) {
    if (!window.confirm(`Delete ${u.display_name}? Their tasks stay, unassigned.`)) return;
    try {
      await deleteUser({ data: { id: u.id } });
      await refresh();
      toast.success("Member deleted");
    } catch (err) {
      toast.error("Could not delete", { description: errorMessage(err) });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Members"
        description="Everyone with a workspace account, and what they are allowed to do."
        actions={
          <>
            <input
              className="h-9 w-52 rounded-lg border border-input bg-white px-3 text-sm shadow-sm outline-none focus:border-primary"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {canManage ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <UserPlus className="relative h-4 w-4" />
                <span className="relative">Add member</span>
              </button>
            ) : null}
          </>
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members"
          description="Add the first member to give them a login."
        />
      ) : (
        <div className="card-glow overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-black/8 bg-black/[0.02] text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Member</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Last sign-in</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i, 15) * 0.02 }}
                  className={cn("border-b border-black/5", !u.is_active && "opacity-60")}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {u.display_name}
                          {u.id === ctx.user.id ? (
                            <span className="ml-2 text-[11px] text-muted-foreground">(you)</span>
                          ) : null}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          @{u.username}
                          {u.email ? ` · ${u.email}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {u.is_admin ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : null}
                      {u.is_admin
                        ? "Administrator"
                        : (u.role_name ?? <span className="text-muted-foreground">No role</span>)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        u.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700",
                      )}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                    {u.must_change_password ? (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Temp password
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.last_login_at ? timeAgo(u.last_login_at) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage || can("people.impersonate") ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/5"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="manage-theme">
                          {can("people.impersonate") &&
                          u.id !== ctx.user.id &&
                          u.is_active &&
                          !ctx.impersonator ? (
                            <DropdownMenuItem onSelect={() => void viewAs(u)}>
                              <Eye className="mr-2 h-4 w-4" /> View as{" "}
                              {u.display_name.split(" ")[0]}
                            </DropdownMenuItem>
                          ) : null}
                          {canManage ? (
                            <>
                              <DropdownMenuItem onSelect={() => setEditing(u)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setResetting(u)}>
                                <KeyRound className="mr-2 h-4 w-4" /> Reset password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {u.id !== ctx.user.id ? (
                                <DropdownMenuItem onSelect={() => void toggleActive(u)}>
                                  {u.is_active ? "Deactivate" : "Reactivate"}
                                </DropdownMenuItem>
                              ) : null}
                              {!u.is_admin && u.id !== ctx.user.id ? (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={() => void remove(u)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              ) : null}
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roles={roles}
        onDone={refresh}
      />
      <EditUserDialog
        user={editing}
        onOpenChange={(o) => !o && setEditing(null)}
        roles={roles}
        onDone={refresh}
      />
      <ResetPasswordDialog
        user={resetting}
        onOpenChange={(o) => !o && setResetting(null)}
        onDone={refresh}
      />
    </>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm">{value}</span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          toast.success("Copied");
        }}
        className="grid h-7 w-7 place-items-center rounded-md hover:bg-black/5"
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  roles: PmRole[];
  onDone: () => Promise<void>;
}) {
  const ctx = useManage();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [roleId, setRoleId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mustChange, setMustChange] = useState(true);
  const [color, setColor] = useState(AVATAR_COLORS[1]!);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    if (open) {
      setUsername("");
      setDisplayName("");
      setEmail("");
      setPassword(generatePassword());
      setRoleId(roles.find((r) => r.name === "Member")?.id ?? "");
      setIsAdmin(false);
      setMustChange(true);
      setError(null);
      setCreated(null);
    }
  }, [open, roles]);

  const create = useMutation({
    mutationFn: () =>
      createUser({
        data: {
          username,
          display_name: displayName,
          email,
          password,
          role_id: roleId || null,
          is_admin: isAdmin,
          must_change_password: mustChange,
          avatar_color: color,
        },
      }),
    onSuccess: async () => {
      setCreated({ username: username.toLowerCase(), password });
      await onDone();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    create.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="manage-theme max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">Account ready</DialogTitle>
              <DialogDescription>
                Share these with the member. The password is only shown once.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-2">
              <CopyRow
                label="Sign in at"
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/manage`}
              />
              <CopyRow label="Username" value={created.username} />
              <CopyRow label="Password" value={created.password} />
            </div>
            <DialogFooter className="mt-5">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onOpenChange(false)}
              >
                <span className="relative">Done</span>
              </button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle className="font-display">Add a member</DialogTitle>
              <DialogDescription>
                They sign in with a username and password you set here.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name" required>
                  <input
                    className={inputClass}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    autoFocus
                  />
                </Field>
                <Field label="Username" required hint="letters, digits, . _ -">
                  <input
                    className={cn(inputClass, "font-mono")}
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))
                    }
                    required
                  />
                </Field>
              </div>
              <Field label="Email" hint="optional">
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Role">
                  <SelectField
                    value={roleId}
                    onChange={setRoleId}
                    allowEmpty="No role"
                    options={roles
                      .filter((r) => r.name !== "Administrator")
                      .map((r) => ({ value: r.id, label: r.name }))}
                  />
                </Field>
                <Field label="Temporary password" required>
                  <div className="flex gap-2">
                    <input
                      className={cn(inputClass, "font-mono")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm shrink-0"
                      onClick={() => setPassword(generatePassword())}
                    >
                      New
                    </button>
                  </div>
                </Field>
              </div>
              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mustChange}
                    onChange={(e) => setMustChange(e.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Ask them to change it on first sign-in
                </label>
                {ctx.user.is_admin ? (
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAdmin}
                      onChange={(e) => setIsAdmin(e.target.checked)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    Administrator
                  </label>
                ) : null}
              </div>
              <Field label="Avatar colour">
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={c}
                      className={cn(
                        "h-7 w-7 rounded-full transition-transform",
                        color === c
                          ? "scale-110 ring-2 ring-foreground ring-offset-2"
                          : "hover:scale-105",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </Field>
              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
            </div>
            <DialogFooter className="mt-6">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="relative h-4 w-4 animate-spin" /> : null}
                <span className="relative">Create account</span>
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onOpenChange,
  roles,
  onDone,
}: {
  user: PmUser | null;
  onOpenChange: (o: boolean) => void;
  roles: PmRole[];
  onDone: () => Promise<void>;
}) {
  const ctx = useManage();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [color, setColor] = useState(AVATAR_COLORS[0]!);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setEmail(user.email ?? "");
      setRoleId(user.role_id ?? "");
      setIsAdmin(user.is_admin);
      setColor(user.avatar_color);
      setError(null);
    }
  }, [user]);

  const save = useMutation({
    mutationFn: () =>
      updateUser({
        data: {
          id: user!.id,
          display_name: displayName,
          email,
          role_id: roleId || null,
          avatar_color: color,
          ...(ctx.user.is_admin ? { is_admin: isAdmin } : {}),
        },
      }),
    onSuccess: async () => {
      await onDone();
      onOpenChange(false);
      toast.success("Member updated");
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="manage-theme max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display">Edit {user?.display_name}</DialogTitle>
            <DialogDescription className="font-mono">@{user?.username}</DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4">
            <Field label="Display name" required>
              <input
                className={inputClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Role">
              <SelectField
                value={roleId}
                onChange={setRoleId}
                allowEmpty="No role"
                options={roles
                  .filter((r) => r.name !== "Administrator")
                  .map((r) => ({ value: r.id, label: r.name }))}
              />
            </Field>
            {ctx.user.is_admin ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Administrator (full access)
              </label>
            ) : null}
            <Field label="Avatar colour">
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={c}
                    className={cn(
                      "h-7 w-7 rounded-full transition-transform",
                      color === c
                        ? "scale-110 ring-2 ring-foreground ring-offset-2"
                        : "hover:scale-105",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Field>
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          </div>
          <DialogFooter className="mt-6">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="relative h-4 w-4 animate-spin" /> : null}
              <span className="relative">Save</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onOpenChange,
  onDone,
}: {
  user: PmUser | null;
  onOpenChange: (o: boolean) => void;
  onDone: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [mustChange, setMustChange] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPassword(generatePassword());
      setMustChange(true);
      setError(null);
      setDone(null);
    }
  }, [user]);

  const reset = useMutation({
    mutationFn: () =>
      resetUserPassword({ data: { id: user!.id, password, must_change_password: mustChange } }),
    onSuccess: async () => {
      setDone(password);
      await onDone();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="manage-theme max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Reset password for {user?.display_name}
          </DialogTitle>
          <DialogDescription>Their current password stops working immediately.</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="mt-4 grid gap-2">
            <CopyRow label="Username" value={user?.username ?? ""} />
            <CopyRow label="New password" value={done} />
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            <Field label="New password" required>
              <div className="flex gap-2">
                <input
                  className={cn(inputClass, "font-mono")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm shrink-0"
                  onClick={() => setPassword(generatePassword())}
                >
                  New
                </button>
              </div>
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mustChange}
                onChange={(e) => setMustChange(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Ask them to change it on next sign-in
            </label>
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          </div>
        )}
        <DialogFooter className="mt-5">
          {done ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onOpenChange(false)}
            >
              <span className="relative">Done</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={reset.isPending}
                onClick={() => reset.mutate()}
              >
                {reset.isPending ? <Loader2 className="relative h-4 w-4 animate-spin" /> : null}
                <span className="relative">Reset password</span>
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
