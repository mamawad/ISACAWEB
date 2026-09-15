import { useRef, useState, type DragEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  CloudUpload,
  Download,
  ExternalLink,
  File as FileIcon,
  FileImage,
  FileText,
  FolderOpen,
  Link2,
  Loader2,
  Trash2,
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
import { addLink, deleteFile, getFileUrl, listProjectFiles } from "@/lib/pm/files.functions";
import type { PmFile } from "@/lib/pm/permissions";
import { useManage } from "@/components/manage/manage-context";
import { useProject } from "@/components/manage/project-context";
import { EmptyState } from "@/components/manage/shell";
import { Avatar } from "@/components/manage/avatar";
import { Field, errorMessage, formatBytes, inputClass, timeAgo } from "@/components/manage/fields";
import { uploadFile } from "@/components/manage/upload";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manage/projects/$key/drive")({
  component: DrivePage,
});

function iconFor(f: PmFile) {
  if (f.kind === "link") return Link2;
  if (f.mime?.startsWith("image/")) return FileImage;
  if (f.mime?.includes("pdf") || f.mime?.startsWith("text/")) return FileText;
  return FileIcon;
}

function DrivePage() {
  const ctx = useManage();
  const { project } = useProject();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ name: string; pct: number } | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["pm", "files", project.id],
    queryFn: () => listProjectFiles({ data: { project_id: project.id } }),
  });
  const files = query.data?.files ?? [];
  const canUpload = (query.data?.canUpload ?? false) && !project.is_archived;
  const canManage = query.data?.canManage ?? false;

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["pm", "files", project.id] });
  }

  async function handleFiles(list: FileList | File[] | null) {
    if (!list) return;
    const arr = Array.from(list);
    if (arr.length === 0) return;
    try {
      for (const f of arr) {
        setProgress({ name: f.name, pct: 0 });
        await uploadFile(project.id, null, f, (pct) => setProgress({ name: f.name, pct }));
      }
      toast.success(arr.length === 1 ? "Uploaded" : `${arr.length} files uploaded`);
      await refresh();
    } catch (err) {
      toast.error("Upload failed", { description: errorMessage(err) });
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (canUpload) void handleFiles(e.dataTransfer.files);
  }

  const link = useMutation({
    mutationFn: () =>
      addLink({ data: { project_id: project.id, name: linkName || linkUrl, url: linkUrl } }),
    onSuccess: async () => {
      setLinkOpen(false);
      setLinkName("");
      setLinkUrl("");
      await refresh();
      toast.success("Link pinned");
    },
    onError: (err) => setLinkError(errorMessage(err)),
  });

  async function open(f: PmFile) {
    try {
      const { url } = await getFileUrl({ data: { id: f.id } });
      window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error("Could not open", { description: errorMessage(err) });
    }
  }
  async function remove(f: PmFile) {
    if (!window.confirm(`Delete "${f.name}"?`)) return;
    try {
      await deleteFile({ data: { id: f.id } });
      await refresh();
    } catch (err) {
      toast.error("Could not delete", { description: errorMessage(err) });
    }
  }

  const totalBytes = files.reduce((n, f) => n + (f.size ?? 0), 0);

  return (
    <>
      {canUpload ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "mb-5 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-black/12 bg-white/60",
          )}
        >
          <motion.span
            animate={dragOver ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
            className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"
          >
            <CloudUpload className="h-6 w-6" />
          </motion.span>
          <p className="text-sm font-medium">Drop files here, or</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="btn btn-primary btn-sm"
            >
              <span className="relative">Choose files</span>
            </button>
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              className="btn btn-ghost btn-sm"
            >
              <Link2 className="h-4 w-4" /> Pin a link
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Up to 50 MB per file. Links can point at Google Drive, OneDrive, Figma — anything.
          </p>
          <input
            ref={input}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          {progress ? (
            <div className="mt-2 w-full max-w-sm">
              <p className="mb-1 truncate text-xs text-muted-foreground">
                Uploading {progress.name}…
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full bg-primary" animate={{ width: `${progress.pct}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {query.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="The drive is empty"
          description={
            canUpload
              ? "Upload files or pin links so the team has one place to look."
              : "Nothing has been shared here yet."
          }
        />
      ) : (
        <div className="card-glow overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 text-xs text-muted-foreground">
            <span>
              {files.length} item{files.length === 1 ? "" : "s"} · {formatBytes(totalBytes)}
            </span>
          </div>
          <ul className="divide-y divide-black/5">
            {files.map((f, i) => {
              const Icon = iconFor(f);
              const own = f.uploaded_by === ctx.user.id;
              return (
                <motion.li
                  key={f.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 12) * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.025]"
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                      f.kind === "link"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <button
                    type="button"
                    onClick={() => void open(f)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-medium hover:text-primary">
                      {f.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {f.kind === "link"
                        ? f.url
                        : `${formatBytes(f.size)}${f.mime ? ` · ${f.mime}` : ""}`}
                    </span>
                  </button>
                  <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:inline-flex">
                    <Avatar user={f.uploader} size="xs" />
                    {timeAgo(f.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void open(f)}
                    className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/5"
                    aria-label="Open"
                  >
                    {f.kind === "link" ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                  {own || canManage ? (
                    <button
                      type="button"
                      onClick={() => void remove(f)}
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Pin a link</DialogTitle>
            <DialogDescription>Keep shared drives and documents one click away.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4">
            <Field label="Name">
              <input
                className={inputClass}
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="Event photos (Google Drive)"
              />
            </Field>
            <Field label="URL" required>
              <input
                className={inputClass}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
              />
            </Field>
            {linkError ? <p className="text-sm font-medium text-destructive">{linkError}</p> : null}
          </div>
          <DialogFooter className="mt-5">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setLinkOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!linkUrl || link.isPending}
              onClick={() => link.mutate()}
            >
              {link.isPending ? <Loader2 className="relative h-4 w-4 animate-spin" /> : null}
              <span className="relative">Pin link</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
