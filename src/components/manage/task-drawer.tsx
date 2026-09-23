import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  addComment,
  deleteComment,
  deleteTask,
  getTask,
  listProjectTasks,
  updateTask,
  type UpdateTaskInput,
} from "@/lib/pm/tasks.functions";
import { addLink, deleteFile, getFileUrl } from "@/lib/pm/files.functions";
import { describeActivity } from "@/lib/pm/activity-text";
import {
  PARENT_LABEL,
  PARENT_TYPE,
  PRIORITIES,
  STATUSES,
  TASK_TYPES,
  type PmTask,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/lib/pm/permissions";
import { useManage } from "./manage-context";
import { useProject } from "./project-context";
import { Avatar } from "./avatar";
import { PriorityIcon, StatusBadge, TypeIcon } from "./badges";
import {
  Field,
  SelectField,
  UserSelect,
  errorMessage,
  formatBytes,
  formatDate,
  inputClass,
  timeAgo,
} from "./fields";
import { uploadFile } from "./upload";
import { cn } from "@/lib/utils";

type Patch = Omit<UpdateTaskInput, "id">;

/** Slide-over with the full task: fields, subtasks, attachments, comments, activity. */
export function TaskDrawer({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  return (
    <Sheet open={taskId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="manage-theme w-full overflow-y-auto border-l border-border bg-background p-0 text-foreground sm:max-w-2xl"
      >
        <SheetTitle className="sr-only">Task details</SheetTitle>
        {taskId ? <TaskBody key={taskId} taskId={taskId} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function TaskBody({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const ctx = useManage();
  const { project, people, openTask, openCreate, rights } = useProject();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["pm", "task", taskId],
    queryFn: () => getTask({ data: { id: taskId } }),
  });
  const epicsQuery = useQuery({
    queryKey: ["pm", "tasks", project.id],
    queryFn: () => listProjectTasks({ data: { project_id: project.id } }),
  });
  const [tab, setTab] = useState<"comments" | "activity">("comments");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function invalidate() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["pm", "task", taskId] }),
      qc.invalidateQueries({ queryKey: ["pm", "tasks", project.id] }),
      qc.invalidateQueries({ queryKey: ["pm", "project", project.key] }),
      qc.invalidateQueries({ queryKey: ["pm", "dashboard"] }),
      qc.invalidateQueries({ queryKey: ["pm", "my-tasks"] }),
    ]);
  }

  const update = useMutation({
    mutationFn: (patch: Patch) => updateTask({ data: { id: taskId, ...patch } }),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error("Could not save", { description: errorMessage(err) }),
  });
  const remove = useMutation({
    mutationFn: () => deleteTask({ data: { id: taskId } }),
    onSuccess: async () => {
      onClose();
      await invalidate();
      toast.success("Task deleted");
    },
    onError: (err) => toast.error("Could not delete", { description: errorMessage(err) }),
  });

  if (query.isLoading || !query.data) {
    return (
      <div className="grid gap-4 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (query.isError) {
    return <p className="p-6 text-sm text-destructive">{errorMessage(query.error)}</p>;
  }

  const { task, canEdit, canDelete, comments, activity, files, subtasks } = query.data;
  const parentType = PARENT_TYPE[task.type];
  const parentOptions = (epicsQuery.data?.tasks ?? []).filter(
    (t) => t.type === parentType && t.id !== task.id,
  );
  const set = (patch: Patch) => update.mutate(patch);

  return (
    <div className="flex min-h-full flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-background/90 px-5 py-3 backdrop-blur">
        <TypeIcon type={task.type} />
        <span className="font-mono text-sm font-semibold text-muted-foreground">{task.key}</span>
        {task.parent ? (
          <>
            <span className="text-muted-foreground">/</span>
            <button
              type="button"
              onClick={() => openTask(task.parent!.id)}
              className="truncate text-xs text-primary hover:underline"
            >
              {task.parent.key} {task.parent.title}
            </button>
          </>
        ) : null}
        <span className="ml-auto flex items-center gap-1">
          {update.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
          {canDelete ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/5"
                  aria-label="More"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="manage-theme">
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </span>
      </div>

      <div className="flex-1 px-5 py-5">
        <TitleEditor value={task.title} canEdit={canEdit} onSave={(title) => set({ title })} />

        {/* Field grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Status">
            <SelectField
              value={task.status}
              disabled={!canEdit}
              onChange={(v) => set({ status: v as TaskStatus })}
              options={STATUSES.map((s) => ({ value: s.key, label: s.label }))}
            />
          </Field>
          <Field label="Assignee">
            <UserSelect
              value={task.assignee_id}
              disabled={!canEdit}
              onChange={(id) => set({ assignee_id: id })}
              users={people}
            />
          </Field>
          <Field label="Priority">
            <SelectField
              value={task.priority}
              disabled={!canEdit}
              onChange={(v) => set({ priority: v as TaskPriority })}
              options={PRIORITIES.map((p) => ({ value: p.key, label: p.label }))}
            />
          </Field>
          <Field label="Type">
            <SelectField
              value={task.type}
              disabled={!canEdit}
              onChange={(v) => set({ type: v as TaskType })}
              options={TASK_TYPES.map((t) => ({ value: t.key, label: t.label }))}
            />
          </Field>
          <Field label="Start date">
            <input
              type="date"
              className={inputClass}
              disabled={!canEdit}
              value={task.start_date ?? ""}
              onChange={(e) => set({ start_date: e.target.value || null })}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className={inputClass}
              disabled={!canEdit}
              value={task.due_date ?? ""}
              onChange={(e) => set({ due_date: e.target.value || null })}
            />
          </Field>
          {task.type !== "epic" ? (
            <Field label={PARENT_LABEL[task.type]}>
              <SelectField
                value={task.parent_id ?? ""}
                disabled={!canEdit}
                allowEmpty={`No ${PARENT_TYPE[task.type] ?? "parent"}`}
                onChange={(v) => set({ parent_id: v || null })}
                options={parentOptions.map((e) => ({ value: e.id, label: `${e.key} ${e.title}` }))}
              />
            </Field>
          ) : null}
          <Field label="Estimate (hours)">
            <input
              type="number"
              min={0}
              step={0.5}
              className={inputClass}
              disabled={!canEdit}
              defaultValue={task.estimate_hours ?? ""}
              onBlur={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                if (v !== task.estimate_hours) set({ estimate_hours: v });
              }}
            />
          </Field>
          <Field label="Labels" hint="comma separated" className="sm:col-span-2">
            <input
              className={inputClass}
              disabled={!canEdit}
              defaultValue={task.labels.join(", ")}
              onBlur={(e) => {
                const labels = e.target.value
                  .split(",")
                  .map((l) => l.trim())
                  .filter(Boolean);
                if (labels.join("|") !== task.labels.join("|")) set({ labels });
              }}
            />
          </Field>
        </div>

        <DescriptionEditor
          value={task.description}
          canEdit={canEdit}
          onSave={(description) => set({ description })}
        />

        {/* Subtasks */}
        {task.type !== "epic" && subtasks.length === 0 && !rights.canCreate ? null : (
          <Section
            icon={Plus}
            title={task.type === "epic" ? "Work in this epic" : "Subtasks"}
            count={subtasks.length}
            action={
              rights.canCreate ? (
                <button
                  type="button"
                  onClick={() => openCreate({ parent_id: task.id })}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Add
                </button>
              ) : null
            }
          >
            {subtasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              <ul className="divide-y divide-black/5 rounded-xl border border-black/8 bg-white">
                {subtasks.map((s: PmTask) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => openTask(s.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/[0.03]"
                    >
                      <TypeIcon type={s.type} size="xs" />
                      <span className="font-mono text-[11px] text-muted-foreground">{s.key}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{s.title}</span>
                      <StatusBadge status={s.status} />
                      <Avatar user={s.assignee} size="xs" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* Attachments */}
        <Attachments
          taskId={task.id}
          files={files}
          canUpload={rights.canUpload}
          onChange={invalidate}
        />

        {/* Comments / activity */}
        <div className="mt-8">
          <div className="flex gap-1 rounded-full bg-muted p-1">
            {(
              [
                { key: "comments", label: "Comments", icon: MessageSquare, n: comments.length },
                { key: "activity", label: "Activity", icon: Activity, n: activity.length },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-2 rounded-full py-1.5 text-sm font-medium transition-colors",
                  tab === t.key ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {tab === t.key ? (
                  <motion.span
                    layoutId="task-tab"
                    className="absolute inset-0 rounded-full bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <t.icon className="relative h-4 w-4" />
                <span className="relative">{t.label}</span>
                <span className="relative font-mono text-[11px] text-muted-foreground">{t.n}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              {tab === "comments" ? (
                <Comments
                  taskId={task.id}
                  comments={comments}
                  canComment={rights.access !== "viewer" || rights.canEditAny}
                  onChange={invalidate}
                />
              ) : (
                <ul className="flex flex-col gap-3">
                  {activity.length === 0 ? (
                    <li className="text-sm text-muted-foreground">No activity yet.</li>
                  ) : null}
                  {activity.map((a) => (
                    <li key={a.id} className="flex gap-3 text-sm">
                      <Avatar user={a.user} size="sm" />
                      <div>
                        <p>
                          <span className="font-semibold">{a.user?.display_name ?? "Someone"}</span>{" "}
                          <span className="text-muted-foreground">{describeActivity(a)}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">{timeAgo(a.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-8 border-t border-black/5 pt-4 text-[11px] text-muted-foreground">
          Reported by {task.reporter?.display_name ?? "unknown"} · created{" "}
          {formatDate(task.created_at, { year: "numeric" })} · updated {timeAgo(task.updated_at)}
          {ctx.impersonator ? " · viewing as member" : ""}
        </p>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="manage-theme">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {task.key}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the task, its comments and attachments. Subtasks are kept but detached.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => remove.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  action,
  children,
}: {
  icon: typeof Plus;
  title: string;
  count?: number | undefined;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
        {count !== undefined ? (
          <span className="font-mono text-[11px] text-muted-foreground">{count}</span>
        ) : null}
        <span className="ml-auto">{action}</span>
      </div>
      {children}
    </section>
  );
}

function TitleEditor({
  value,
  canEdit,
  onSave,
}: {
  value: string;
  canEdit: boolean;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  function commit() {
    const t = draft.trim();
    if (t && t !== value) onSave(t);
    else setDraft(value);
  }
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-2xl font-bold tracking-tight outline-none transition",
        canEdit && "hover:border-black/10 focus:border-primary focus:bg-white",
      )}
      value={draft}
      readOnly={!canEdit}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setDraft(value);
      }}
    />
  );
}

function DescriptionEditor({
  value,
  canEdit,
  onSave,
}: {
  value: string | null;
  canEdit: boolean;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);
  return (
    <Section
      icon={FileText}
      title="Description"
      action={
        canEdit && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        ) : null
      }
    >
      {editing ? (
        <div className="grid gap-2">
          <textarea
            className={cn(inputClass, "h-40 resize-y py-2")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onSave(draft);
                setEditing(false);
              }}
            >
              <span className="relative">Save</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setDraft(value ?? "");
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : value ? (
        <p className="rounded-xl border border-black/8 bg-white px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {value}
        </p>
      ) : (
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => setEditing(true)}
          className="w-full rounded-xl border border-dashed border-black/15 px-4 py-3 text-left text-sm text-muted-foreground hover:border-primary/40 disabled:cursor-default"
        >
          {canEdit ? "Add a description…" : "No description."}
        </button>
      )}
    </Section>
  );
}

function Attachments({
  taskId,
  files,
  canUpload,
  onChange,
}: {
  taskId: string;
  files: {
    id: string;
    kind: "file" | "link";
    name: string;
    size: number | null;
    url: string | null;
    uploaded_by: string | null;
  }[];
  canUpload: boolean;
  onChange: () => Promise<void>;
}) {
  const { project } = useProject();
  const ctx = useManage();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [linking, setLinking] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    try {
      for (const f of Array.from(list)) {
        setProgress(0);
        await uploadFile(project.id, taskId, f, setProgress);
      }
      toast.success("Uploaded");
      await onChange();
    } catch (err) {
      toast.error("Upload failed", { description: errorMessage(err) });
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }
  async function open(id: string) {
    try {
      const { url } = await getFileUrl({ data: { id } });
      window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error("Could not open", { description: errorMessage(err) });
    }
  }
  async function remove(id: string) {
    try {
      await deleteFile({ data: { id } });
      await onChange();
    } catch (err) {
      toast.error("Could not delete", { description: errorMessage(err) });
    }
  }
  async function saveLink() {
    try {
      await addLink({
        data: { project_id: project.id, task_id: taskId, name: linkName || linkUrl, url: linkUrl },
      });
      setLinking(false);
      setLinkName("");
      setLinkUrl("");
      await onChange();
    } catch (err) {
      toast.error("Could not add link", { description: errorMessage(err) });
    }
  }

  return (
    <Section
      icon={Paperclip}
      title="Attachments"
      count={files.length}
      action={
        canUpload ? (
          <span className="flex gap-3">
            <button
              type="button"
              onClick={() => setLinking((v) => !v)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              + Link
            </button>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="text-xs font-semibold text-primary hover:underline"
            >
              + Upload
            </button>
            <input
              ref={input}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => void onFiles(e.target.files)}
            />
          </span>
        ) : null
      }
    >
      {progress !== null ? (
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {linking ? (
        <div className="mb-3 grid gap-2 rounded-xl border border-black/8 bg-white p-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <input
            className={inputClass}
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
          />
          <input
            className={inputClass}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void saveLink()}>
            <span className="relative">Add</span>
          </button>
        </div>
      ) : null}
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files or links attached.</p>
      ) : (
        <ul className="divide-y divide-black/5 rounded-xl border border-black/8 bg-white">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              {f.kind === "link" ? (
                <Link2 className="h-4 w-4 text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {f.kind === "link" ? "link" : formatBytes(f.size)}
              </span>
              <button
                type="button"
                onClick={() => void open(f.id)}
                className="grid h-7 w-7 place-items-center rounded-md hover:bg-black/5"
                aria-label="Open"
              >
                {f.kind === "link" ? (
                  <ExternalLink className="h-3.5 w-3.5" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </button>
              {f.uploaded_by === ctx.user.id || canUpload ? (
                <button
                  type="button"
                  onClick={() => void remove(f.id)}
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Comments({
  taskId,
  comments,
  canComment,
  onChange,
}: {
  taskId: string;
  comments: {
    id: string;
    body: string;
    created_at: string;
    user_id: string | null;
    user: { id: string; display_name: string; username: string; avatar_color: string } | null;
  }[];
  canComment: boolean;
  onChange: () => Promise<void>;
}) {
  const ctx = useManage();
  const [body, setBody] = useState("");
  const add = useMutation({
    mutationFn: () => addComment({ data: { task_id: taskId, body } }),
    onSuccess: async () => {
      setBody("");
      await onChange();
    },
    onError: (err) => toast.error("Could not comment", { description: errorMessage(err) }),
  });
  async function remove(id: string) {
    try {
      await deleteComment({ data: { id } });
      await onChange();
    } catch (err) {
      toast.error("Could not delete", { description: errorMessage(err) });
    }
  }
  return (
    <div>
      <ul className="flex flex-col gap-4">
        {comments.length === 0 ? (
          <li className="text-sm text-muted-foreground">No comments yet.</li>
        ) : null}
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar user={c.user} size="sm" />
            <div className="min-w-0 flex-1 rounded-xl border border-black/8 bg-white px-3 py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">
                  {c.user?.display_name ?? "Former member"}
                </span>
                <span className="text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                {c.user_id === ctx.user.id ? (
                  <button
                    type="button"
                    onClick={() => void remove(c.id)}
                    className="ml-auto text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {canComment ? (
        <div className="mt-4 flex gap-3">
          <Avatar user={ctx.user} size="sm" withTitle={false} />
          <div className="flex-1">
            <textarea
              className={cn(inputClass, "h-20 resize-y py-2")}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && body.trim()) add.mutate();
              }}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!body.trim() || add.isPending}
                onClick={() => add.mutate()}
              >
                {add.isPending ? <Loader2 className="relative h-4 w-4 animate-spin" /> : null}
                <span className="relative">Comment</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TaskRowPriority({ task }: { task: PmTask }) {
  return <PriorityIcon priority={task.priority} />;
}
