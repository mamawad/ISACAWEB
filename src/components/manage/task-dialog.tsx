import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTask, listProjectTasks, type CreateTaskInput } from "@/lib/pm/tasks.functions";
import {
  CHILD_TYPE,
  PARENT_LABEL,
  PARENT_TYPE,
  PRIORITIES,
  STATUSES,
  TASK_TYPES,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/lib/pm/permissions";
import { useProject } from "./project-context";
import { Field, SelectField, UserSelect, errorMessage, inputClass } from "./fields";
import { cn } from "@/lib/utils";

type Preset = { status?: string | undefined; parent_id?: string | undefined };

export function CreateTaskDialog({
  open,
  preset,
  onOpenChange,
}: {
  open: boolean;
  preset: Preset;
  onOpenChange: (open: boolean) => void;
}) {
  const { project, people, openTask } = useProject();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("task");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [parent, setParent] = useState<string>("");
  const [start, setStart] = useState("");
  const [due, setDue] = useState("");
  const [labels, setLabels] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tasks = useQuery({
    queryKey: ["pm", "tasks", project.id],
    queryFn: () => listProjectTasks({ data: { project_id: project.id } }),
    enabled: open,
  });
  const allTasks = tasks.data?.tasks ?? [];
  const parentType = PARENT_TYPE[type];
  const parentOptions = parentType ? allTasks.filter((t) => t.type === parentType) : [];
  const presetParent = preset.parent_id
    ? allTasks.find((t) => t.id === preset.parent_id)
    : undefined;

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setType("task");
    setStatus((preset.status as TaskStatus | undefined) ?? "todo");
    setPriority("medium");
    setAssignee(null);
    setParent(preset.parent_id ?? "");
    setStart("");
    setDue("");
    setLabels("");
    setError(null);
  }, [open, preset.status, preset.parent_id]);

  // When opened from a parent task, default to the matching child type.
  useEffect(() => {
    if (!open || !presetParent) return;
    const child = CHILD_TYPE[presetParent.type];
    if (child) setType(child);
  }, [open, presetParent]);

  // Drop a parent that no longer matches the selected type.
  useEffect(() => {
    if (!parent) return;
    const current = allTasks.find((t) => t.id === parent);
    if (current && current.type !== parentType) setParent("");
  }, [parent, parentType, allTasks]);

  const create = useMutation({
    mutationFn: (payload: CreateTaskInput) => createTask({ data: payload }),
    onSuccess: async (res) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["pm", "tasks", project.id] }),
        qc.invalidateQueries({ queryKey: ["pm", "project", project.key] }),
        qc.invalidateQueries({ queryKey: ["pm", "dashboard"] }),
        qc.invalidateQueries({ queryKey: ["pm", "my-tasks"] }),
      ]);
      onOpenChange(false);
      toast.success(`${res.task.key} created`, {
        action: { label: "Open", onClick: () => openTask(res.task.id) },
      });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    create.mutate({
      project_id: project.id,
      title,
      description,
      type,
      status,
      priority,
      assignee_id: assignee,
      parent_id: parent || null,
      labels: labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      start_date: start || null,
      due_date: due || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="manage-theme max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="font-display">
              New task in <span className="font-mono text-primary">{project.key}</span>
            </DialogTitle>
            <DialogDescription>
              Give it a clear title; everything else can change later.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4">
            <Field label="Title" required>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Type">
                <SelectField
                  value={type}
                  onChange={(v) => setType(v as TaskType)}
                  options={TASK_TYPES.map((t) => ({ value: t.key, label: t.label }))}
                />
              </Field>
              <Field label="Status">
                <SelectField
                  value={status}
                  onChange={(v) => setStatus(v as TaskStatus)}
                  options={STATUSES.map((s) => ({ value: s.key, label: s.label }))}
                />
              </Field>
              <Field label="Priority">
                <SelectField
                  value={priority}
                  onChange={(v) => setPriority(v as TaskPriority)}
                  options={PRIORITIES.map((p) => ({ value: p.key, label: p.label }))}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assignee">
                <UserSelect value={assignee} onChange={setAssignee} users={people} />
              </Field>
              <Field
                label={PARENT_LABEL[type]}
                hint={parentType ? undefined : "Epics sit at the top"}
              >
                <SelectField
                  value={parent}
                  onChange={setParent}
                  disabled={!parentType}
                  allowEmpty={`No ${parentType ?? "parent"}`}
                  options={parentOptions.map((e) => ({
                    value: e.id,
                    label: `${e.key} ${e.title}`,
                  }))}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date">
                <input
                  type="date"
                  className={inputClass}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  className={inputClass}
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  min={start || undefined}
                />
              </Field>
            </div>
            <Field label="Labels" hint="comma separated">
              <input
                className={inputClass}
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
              />
            </Field>
            <Field label="Description">
              <textarea
                className={cn(inputClass, "h-28 resize-y py-2")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
              <span className="relative">Create task</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
