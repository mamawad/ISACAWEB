import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PmFile } from "./permissions";
import { hasPermission } from "./permissions";

const BUCKET = "pm-drive";
const MAX_BYTES = 50 * 1024 * 1024;

const requestUploadSchema = z.object({
  project_id: z.string().uuid(),
  task_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  size: z.number().int().min(0).max(MAX_BYTES, "Files must be under 50 MB."),
  mime: z.string().max(120).optional().or(z.literal("")),
});

const registerSchema = z.object({
  project_id: z.string().uuid(),
  task_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  path: z.string().min(1).max(400),
  size: z.number().int().min(0).max(MAX_BYTES),
  mime: z.string().max(120).optional().or(z.literal("")),
});

const linkSchema = z.object({
  project_id: z.string().uuid(),
  task_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  url: z.string().trim().url("Enter a full URL, starting with https://").max(2000),
});

function safeName(name: string): string {
  return (
    name
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "file"
  );
}

/** Files and links in a project's drive. */
export const listProjectFiles = createServerFn({ method: "GET" })
  .inputValidator((data: { project_id: string }) =>
    z.object({ project_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requireContext, requireProjectView } = await import("./session.server");
    const { pmDb, mapFile, MINI_USER_COLS } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const rights = await requireProjectView(db, ctx, data.project_id);
    const { data: rows } = await db
      .from("pm_files")
      .select(`*, uploader:pm_users(${MINI_USER_COLS})`)
      .eq("project_id", data.project_id)
      .order("created_at", { ascending: false });
    return {
      files: ((rows ?? []) as Record<string, unknown>[]).map(mapFile) as PmFile[],
      canUpload: rights.canUpload,
      canManage: rights.canManage || hasPermission(ctx, "files.manage"),
    };
  });

/**
 * Step 1 of an upload: hand the browser a signed upload URL for a fresh
 * object path. The browser PUTs straight to Storage, then calls registerFile.
 */
export const requestUpload = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => requestUploadSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const rights = await rightsFor(db, ctx, data.project_id);
    if (!rights.canUpload) fail("You cannot upload to this project.");
    const path = `${data.project_id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName(data.name)}`;
    const { data: signed, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !signed) fail(error?.message ?? "Could not prepare the upload.");
    return { ok: true as const, path: signed.path, token: signed.token };
  });

/** Step 2 of an upload: record the object once the browser has stored it. */
export const registerFile = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, logActivity, mapFile, MINI_USER_COLS } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const rights = await rightsFor(db, ctx, data.project_id);
    if (!rights.canUpload) fail("You cannot upload to this project.");
    if (!data.path.startsWith(`${data.project_id}/`)) fail("Invalid file path.");
    const { data: row, error } = await db
      .from("pm_files")
      .insert({
        project_id: data.project_id,
        task_id: data.task_id ?? null,
        kind: "file",
        name: data.name,
        storage_path: data.path,
        size: data.size,
        mime: data.mime ? data.mime : null,
        uploaded_by: ctx.user.id,
      })
      .select(`*, uploader:pm_users(${MINI_USER_COLS})`)
      .single();
    if (error || !row) fail(error?.message ?? "Could not save the file record.");
    await logActivity(db, {
      project_id: data.project_id,
      task_id: data.task_id ?? null,
      user_id: ctx.user.id,
      action: "file.uploaded",
      meta: { name: data.name, size: data.size },
    });
    return { ok: true as const, file: mapFile(row as Record<string, unknown>) };
  });

export const addLink = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => linkSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, logActivity, mapFile, MINI_USER_COLS } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const rights = await rightsFor(db, ctx, data.project_id);
    if (!rights.canUpload) fail("You cannot add links to this project.");
    const { data: row, error } = await db
      .from("pm_files")
      .insert({
        project_id: data.project_id,
        task_id: data.task_id ?? null,
        kind: "link",
        name: data.name,
        url: data.url,
        uploaded_by: ctx.user.id,
      })
      .select(`*, uploader:pm_users(${MINI_USER_COLS})`)
      .single();
    if (error || !row) fail(error?.message ?? "Could not save the link.");
    await logActivity(db, {
      project_id: data.project_id,
      task_id: data.task_id ?? null,
      user_id: ctx.user.id,
      action: "file.linked",
      meta: { name: data.name },
    });
    return { ok: true as const, file: mapFile(row as Record<string, unknown>) };
  });

/** Short-lived download URL for a stored file. */
export const getFileUrl = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requireContext, requireProjectView } = await import("./session.server");
    const { pmDb } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const { data: row } = await db
      .from("pm_files")
      .select("project_id, kind, storage_path, url, name")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) fail("File not found.");
    await requireProjectView(db, ctx, row["project_id"] as string);
    if (row["kind"] === "link") return { url: row["url"] as string };
    const { data: signed, error } = await db.storage
      .from(BUCKET)
      .createSignedUrl(row["storage_path"] as string, 300, { download: row["name"] as string });
    if (error || !signed) fail(error?.message ?? "Could not create a download link.");
    return { url: signed.signedUrl };
  });

export const deleteFile = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { requireContext, rightsFor } = await import("./session.server");
    const { pmDb, logActivity } = await import("./db.server");
    const ctx = await requireContext();
    const db = await pmDb();
    const { data: row } = await db
      .from("pm_files")
      .select("project_id, kind, storage_path, name, uploaded_by")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) fail("File not found.");
    const rights = await rightsFor(db, ctx, row["project_id"] as string);
    const own = row["uploaded_by"] === ctx.user.id;
    if (!(own || rights.canManage || hasPermission(ctx, "files.manage")))
      fail("You cannot delete this file.");
    if (row["kind"] === "file" && row["storage_path"]) {
      await db.storage.from(BUCKET).remove([row["storage_path"] as string]);
    }
    await db.from("pm_files").delete().eq("id", data.id);
    await logActivity(db, {
      project_id: row["project_id"] as string,
      user_id: ctx.user.id,
      action: "file.deleted",
      meta: { name: row["name"] },
    });
    return { ok: true as const };
  });

function fail(message: string): never {
  throw new Error(message);
}
