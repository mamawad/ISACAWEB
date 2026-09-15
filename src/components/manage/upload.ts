import { registerFile, requestUpload } from "@/lib/pm/files.functions";
import type { PmFile } from "@/lib/pm/permissions";

/**
 * Browser-side upload: ask the server for a signed Storage URL, PUT the bytes
 * straight to Supabase, then register the object so it shows in the drive.
 */
export async function uploadFile(
  projectId: string,
  taskId: string | null,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<PmFile> {
  onProgress?.(5);
  const signed = await requestUpload({
    data: {
      project_id: projectId,
      task_id: taskId,
      name: file.name,
      size: file.size,
      mime: file.type,
    },
  });
  onProgress?.(20);
  const { supabase } = await import("@/integrations/supabase/client");
  const { error } = await supabase.storage
    .from("pm-drive")
    .uploadToSignedUrl(
      signed.path,
      signed.token,
      file,
      file.type ? { contentType: file.type } : {},
    );
  if (error) throw new Error(error.message);
  onProgress?.(85);
  const res = await registerFile({
    data: {
      project_id: projectId,
      task_id: taskId,
      name: file.name,
      path: signed.path,
      size: file.size,
      mime: file.type,
    },
  });
  onProgress?.(100);
  return res.file;
}
