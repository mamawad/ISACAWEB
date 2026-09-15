import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Archive, ArrowRight, FolderKanban, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createProject, listProjects, type CreateProjectInput } from "@/lib/pm/projects.functions";
import { listPeople } from "@/lib/pm/people.functions";
import { AVATAR_COLORS } from "@/lib/pm/permissions";
import { useCan, useManage } from "@/components/manage/manage-context";
import { EmptyState, PageHeader } from "@/components/manage/shell";
import { Avatar, AvatarStack } from "@/components/manage/avatar";
import { AccessBadge } from "@/components/manage/badges";
import { Field, UserSelect, errorMessage, inputClass } from "@/components/manage/fields";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProjectsSearch = { create?: boolean; archived?: boolean };

export const Route = createFileRoute("/manage/projects/")({
  validateSearch: (search: Record<string, unknown>): ProjectsSearch => {
    const out: ProjectsSearch = {};
    if (search["create"] === true || search["create"] === "true") out.create = true;
    if (search["archived"] === true || search["archived"] === "true") out.archived = true;
    return out;
  },
  head: () => ({ meta: [{ title: "Projects · ISACA Alfaisal workspace" }] }),
  component: ProjectsPage,
});

function suggestKey(name: string): string {
  const words = name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0]!.slice(0, 4).toUpperCase();
  return words
    .slice(0, 4)
    .map((w) => w[0]!)
    .join("")
    .toUpperCase();
}

function ProjectsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const can = useCan();
  const showArchived = search.archived === true;
  const { data, isLoading } = useQuery({
    queryKey: ["pm", "projects", showArchived],
    queryFn: () => listProjects({ data: { archived: showArchived } }),
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (search.create && can("projects.create")) {
      setOpen(true);
      navigate({
        to: "/manage/projects",
        search: (s) => {
          const next = { ...s };
          delete next.create;
          return next;
        },
        replace: true,
      });
    }
  }, [search.create, can, navigate]);

  const projects = data?.projects ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title={showArchived ? "Archived projects" : "Projects"}
        description="One project per team, event or initiative. Each has its own board, timeline and drive."
        actions={
          <>
            <Link
              to="/manage/projects"
              search={showArchived ? {} : { archived: true }}
              className="btn btn-ghost btn-sm"
            >
              <Archive className="h-4 w-4" />
              {showArchived ? "Active projects" : "Archived"}
            </Link>
            {can("projects.create") ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="relative h-4 w-4" />
                <span className="relative">New project</span>
              </button>
            ) : null}
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={showArchived ? "Nothing archived" : "No projects yet"}
          description={
            showArchived
              ? "Archived projects will show up here."
              : can("projects.create")
                ? "Create the first project to start distributing work across the team."
                : "You have not been added to any project yet. Ask a director to add you."
          }
          action={
            !showArchived && can("projects.create") ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <span className="relative">Create a project</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => {
            const total = p.open_tasks + p.done_tasks;
            const pct = total ? Math.round((p.done_tasks / total) * 100) : 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to="/manage/projects/$key"
                  params={{ key: p.key }}
                  className="card-glow group flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl font-mono text-sm font-bold text-white shadow-md"
                      style={{
                        backgroundColor: p.color,
                        boxShadow: `0 10px 24px -12px ${p.color}`,
                      }}
                    >
                      {p.key.slice(0, 3)}
                    </span>
                    <AccessBadge access={p.my_access} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold leading-snug">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {p.description ?? "No description yet."}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${pct}%`, backgroundColor: p.color }}
                      />
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {p.done_tasks}/{total}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar user={p.lead} size="xs" />
                      {p.lead?.display_name ?? "No lead"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <CreateProjectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const ctx = useManage();
  const can = useCan();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]!);
  const [leadId, setLeadId] = useState<string | null>(ctx.user.id);
  const [error, setError] = useState<string | null>(null);

  const people = useQuery({
    queryKey: ["pm", "people"],
    queryFn: () => listPeople(),
    enabled: open && can("people.view"),
  });

  const create = useMutation({
    mutationFn: (payload: CreateProjectInput) => createProject({ data: payload }),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["pm", "projects"] });
      await qc.invalidateQueries({ queryKey: ["pm", "dashboard"] });
      onOpenChange(false);
      toast.success("Project created");
      navigate({ to: "/manage/projects/$key", params: { key: res.key } });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    create.mutate({
      name,
      key: key.toUpperCase(),
      description,
      color,
      lead_id: leadId,
    });
  }

  const members = (people.data?.users ?? []).filter((u) => u.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="font-display">New project</DialogTitle>
            <DialogDescription>
              A project holds a board, a timeline and a drive. The key prefixes every task, e.g.
              PR-12.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4">
            <Field label="Name" required>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!keyTouched) setKey(suggestKey(e.target.value));
                }}
                placeholder="Public Relations"
                autoFocus
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
              <Field label="Key" required hint="2–6 chars">
                <input
                  className={cn(inputClass, "font-mono uppercase")}
                  value={key}
                  onChange={(e) => {
                    setKeyTouched(true);
                    setKey(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    );
                  }}
                  placeholder="PR"
                  required
                />
              </Field>
              <Field label="Lead">
                {can("people.view") ? (
                  <UserSelect
                    value={leadId}
                    onChange={setLeadId}
                    users={members}
                    placeholder="You"
                  />
                ) : (
                  <p className="flex h-10 items-center text-sm text-muted-foreground">You</p>
                )}
              </Field>
            </div>
            <Field label="Description">
              <textarea
                className={cn(inputClass, "h-20 resize-none py-2")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project for?"
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
              <span className="relative">Create project</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
