import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Loader2, Lock, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteRole, listRoles, saveRole } from "@/lib/pm/people.functions";
import { PERMISSIONS, PERMISSION_GROUPS, PROJECT_ACCESS, type PmRole } from "@/lib/pm/permissions";
import { PageHeader } from "@/components/manage/shell";
import { AccessBadge } from "@/components/manage/badges";
import { Field, errorMessage, inputClass } from "@/components/manage/fields";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manage/roles")({
  head: () => ({ meta: [{ title: "Roles & access · ISACA Alfaisal workspace" }] }),
  component: RolesPage,
});

function RolesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["pm", "roles"], queryFn: () => listRoles() });
  const [editing, setEditing] = useState<PmRole | "new" | null>(null);
  const roles = data?.roles ?? [];

  async function refresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["pm", "roles"] }),
      qc.invalidateQueries({ queryKey: ["pm", "people"] }),
    ]);
  }
  async function remove(r: PmRole) {
    if (
      !window.confirm(
        `Delete the role "${r.name}"? Members with it will have no role until you assign another.`,
      )
    )
      return;
    try {
      await deleteRole({ data: { id: r.id } });
      await refresh();
      toast.success("Role deleted");
    } catch (err) {
      toast.error("Could not delete", { description: errorMessage(err) });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Roles & access"
        title="Who can do what"
        description="A role is a named bundle of permissions. Project access (lead, editor, member, viewer) layers on top, per project."
        actions={
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="btn btn-primary btn-sm"
          >
            <Plus className="relative h-4 w-4" />
            <span className="relative">New role</span>
          </button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((r, i) => {
            const all = r.permissions.includes("*");
            const locked = r.name === "Administrator";
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-glow flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        className={cn("h-4 w-4", all ? "text-primary" : "text-muted-foreground")}
                      />
                      <h3 className="font-display text-base font-semibold">{r.name}</h3>
                      {r.is_system ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                          Built-in
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.description ?? "No description."}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {r.user_count} member{r.user_count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-4 flex flex-1 flex-wrap gap-1.5">
                  {all ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      Everything
                    </span>
                  ) : r.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Read-only inside their projects.
                    </span>
                  ) : (
                    PERMISSIONS.filter((p) => r.permissions.includes(p.key)).map((p) => (
                      <span
                        key={p.key}
                        title={p.description}
                        className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {p.label}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-4 flex gap-2 border-t border-black/5 pt-3">
                  {locked ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" /> Cannot be changed
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      {!r.is_system ? (
                        <button
                          type="button"
                          onClick={() => void remove(r)}
                          className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="card-glow mt-6 p-5">
        <h2 className="font-display text-base font-semibold">Project access levels</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set per member, per project, from the project settings tab.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {PROJECT_ACCESS.map((a) => (
            <li key={a.key} className="flex items-start gap-3 rounded-xl bg-muted/60 p-3 text-sm">
              <AccessBadge access={a.key} />
              <span className="text-muted-foreground">{a.description}</span>
            </li>
          ))}
        </ul>
      </div>

      <RoleDialog role={editing} onOpenChange={(o) => !o && setEditing(null)} onDone={refresh} />
    </>
  );
}

function RoleDialog({
  role,
  onOpenChange,
  onDone,
}: {
  role: PmRole | "new" | null;
  onOpenChange: (o: boolean) => void;
  onDone: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const existing = role && role !== "new" ? role : null;

  useEffect(() => {
    if (!role) return;
    setName(existing?.name ?? "");
    setDescription(existing?.description ?? "");
    setPerms(
      new Set(
        existing?.permissions ?? ["tasks.create", "tasks.edit_own", "files.upload", "people.view"],
      ),
    );
    setError(null);
  }, [role, existing]);

  const save = useMutation({
    mutationFn: () =>
      saveRole({
        data: {
          ...(existing ? { id: existing.id } : {}),
          name,
          description,
          permissions: [...perms],
        },
      }),
    onSuccess: async () => {
      await onDone();
      onOpenChange(false);
      toast.success(existing ? "Role updated" : "Role created");
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function toggle(key: string) {
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    save.mutate();
  }

  return (
    <Dialog open={role !== null} onOpenChange={onOpenChange}>
      <DialogContent className="manage-theme max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="font-display">
              {existing ? `Edit ${existing.name}` : "New role"}
            </DialogTitle>
            <DialogDescription>
              Tick what members with this role are allowed to do.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={existing?.is_system}
                  required
                />
              </Field>
              <Field label="Description">
                <input
                  className={inputClass}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => (
                <fieldset key={group} className="rounded-xl border border-black/8 bg-white p-3">
                  <legend className="px-1 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {group}
                  </legend>
                  <div className="grid gap-2">
                    {PERMISSIONS.filter((p) => p.group === group).map((p) => (
                      <label
                        key={p.key}
                        className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 hover:bg-black/[0.03]"
                      >
                        <input
                          type="checkbox"
                          checked={perms.has(p.key)}
                          onChange={() => toggle(p.key)}
                          className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                        />
                        <span>
                          <span className="block text-sm font-medium">{p.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {p.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
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
              <span className="relative">{existing ? "Save role" : "Create role"}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
