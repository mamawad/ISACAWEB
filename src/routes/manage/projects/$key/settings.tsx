import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Loader2, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
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
import { deleteProject, setProjectMember, updateProject } from "@/lib/pm/projects.functions";
import { listPeople } from "@/lib/pm/people.functions";
import { AVATAR_COLORS, PROJECT_ACCESS, type ProjectAccess } from "@/lib/pm/permissions";
import { useCan, useManage } from "@/components/manage/manage-context";
import { useProject } from "@/components/manage/project-context";
import { Avatar } from "@/components/manage/avatar";
import { AccessBadge } from "@/components/manage/badges";
import {
  Field,
  SelectField,
  UserSelect,
  errorMessage,
  inputClass,
} from "@/components/manage/fields";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manage/projects/$key/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const ctx = useManage();
  const can = useCan();
  const { project, members, rights, refetch } = useProject();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [color, setColor] = useState(project.color);
  const [leadId, setLeadId] = useState<string | null>(project.lead_id);
  const [error, setError] = useState<string | null>(null);
  const [addUser, setAddUser] = useState<string | null>(null);
  const [addAccess, setAddAccess] = useState<ProjectAccess>("member");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description ?? "");
    setColor(project.color);
    setLeadId(project.lead_id);
  }, [project]);

  const people = useQuery({
    queryKey: ["pm", "people"],
    queryFn: () => listPeople(),
    enabled: can("people.view"),
  });
  const allUsers = (people.data?.users ?? []).filter((u) => u.is_active);
  const memberIds = new Set(members.map((m) => m.user_id));
  const addable = allUsers.filter((u) => !memberIds.has(u.id));

  async function invalidate() {
    await Promise.all([
      refetch(),
      qc.invalidateQueries({ queryKey: ["pm", "projects"] }),
      qc.invalidateQueries({ queryKey: ["pm", "dashboard"] }),
    ]);
  }

  const save = useMutation({
    mutationFn: () =>
      updateProject({ data: { id: project.id, name, description, color, lead_id: leadId } }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Project updated");
    },
    onError: (err) => setError(errorMessage(err)),
  });
  const member = useMutation({
    mutationFn: (v: { user_id: string; access: ProjectAccess | null }) =>
      setProjectMember({ data: { project_id: project.id, ...v } }),
    onSuccess: async () => {
      setAddUser(null);
      await invalidate();
    },
    onError: (err) => toast.error("Could not update members", { description: errorMessage(err) }),
  });
  const archive = useMutation({
    mutationFn: () =>
      updateProject({ data: { id: project.id, is_archived: !project.is_archived } }),
    onSuccess: async () => {
      await invalidate();
      toast.success(project.is_archived ? "Project restored" : "Project archived");
    },
    onError: (err) =>
      toast.error("Could not change archive status", { description: errorMessage(err) }),
  });
  const remove = useMutation({
    mutationFn: () => deleteProject({ data: { id: project.id } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pm"] });
      toast.success("Project deleted");
      navigate({ to: "/manage/projects" });
    },
    onError: (err) => toast.error("Could not delete", { description: errorMessage(err) }),
  });

  if (!rights.canManage) {
    return (
      <div className="card-glow flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <ShieldAlert className="h-5 w-5 text-primary" />
        Only the project lead or a director can change these settings.
      </div>
    );
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    save.mutate();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={submit} className="card-glow h-fit p-6">
        <h2 className="font-display text-base font-semibold">Details</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Name" required>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Description">
            <textarea
              className={cn(inputClass, "h-24 resize-y py-2")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Lead">
            <UserSelect
              value={leadId}
              onChange={setLeadId}
              users={members.map((m) => m.user)}
            />
          </Field>
          <Field label="Colour">
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-transform",
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
          <button
            type="submit"
            className="btn btn-primary btn-sm justify-self-start"
            disabled={save.isPending}
          >
            {save.isPending ? <Loader2 className="relative h-4 w-4 animate-spin" /> : null}
            <span className="relative">Save changes</span>
          </button>
        </div>

        <div className="mt-8 border-t border-black/5 pt-5">
          <h3 className="text-sm font-semibold">Archive</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Archived projects are read-only and hidden from the main list.
          </p>
          <button
            type="button"
            onClick={() => archive.mutate()}
            className="btn btn-ghost btn-sm mt-3"
            disabled={archive.isPending}
          >
            <Archive className="h-4 w-4" />{" "}
            {project.is_archived ? "Restore project" : "Archive project"}
          </button>
        </div>

        {ctx.user.is_admin ? (
          <div className="mt-6 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
            <h3 className="text-sm font-semibold text-destructive">Delete project</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Removes every task, comment and file. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-destructive px-4 text-xs font-semibold text-white hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4" /> Delete permanently
            </button>
          </div>
        ) : null}
      </form>

      <div className="card-glow h-fit p-6">
        <h2 className="font-display text-base font-semibold">Members</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Access here applies inside this project only. Role permissions still apply everywhere.
        </p>

        {can("people.view") ? (
          <div className="mt-4 grid gap-2 rounded-xl border border-black/8 bg-white p-3 sm:grid-cols-[1fr_9rem_auto]">
            <UserSelect
              value={addUser}
              onChange={setAddUser}
              users={addable}
            />
            <SelectField
              value={addAccess}
              onChange={(v) => setAddAccess(v as ProjectAccess)}
              options={PROJECT_ACCESS.map((a) => ({ value: a.key, label: a.label }))}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!addUser || member.isPending}
              onClick={() => addUser && member.mutate({ user_id: addUser, access: addAccess })}
            >
              <UserPlus className="relative h-4 w-4" />
              <span className="relative">Add</span>
            </button>
          </div>
        ) : null}

        <ul className="mt-4 divide-y divide-black/5">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 py-3">
              <Avatar user={m.user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.user.display_name}
                  {!m.user.is_active ? (
                    <span className="ml-2 text-[11px] text-muted-foreground">(inactive)</span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{m.user.username}
                  {m.user.role_name ? ` · ${m.user.role_name}` : ""}
                </p>
              </div>
              <SelectField
                className="h-8 w-28 text-xs"
                value={m.access}
                onChange={(v) => member.mutate({ user_id: m.user_id, access: v as ProjectAccess })}
                options={PROJECT_ACCESS.map((a) => ({ value: a.key, label: a.label }))}
              />
              <button
                type="button"
                onClick={() => member.mutate({ user_id: m.user_id, access: null })}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-destructive"
                aria-label="Remove member"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROJECT_ACCESS.map((a) => (
            <span
              key={a.key}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <AccessBadge access={a.key} /> {a.description}
            </span>
          ))}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="manage-theme">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Every task, comment, attachment and activity record in {project.key} will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => remove.mutate()}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
