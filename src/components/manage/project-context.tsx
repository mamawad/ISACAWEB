import { createContext, useContext } from "react";
import type { MiniUser, PmMember, PmProject, ProjectRights } from "@/lib/pm/permissions";

export type ProjectData = {
  project: PmProject;
  members: PmMember[];
  rights: ProjectRights;
  /** Active members, for pickers. */
  people: MiniUser[];
  refetch: () => Promise<unknown>;
  openTask: (id: string) => void;
  openCreate: (preset?: { status?: string; parent_id?: string }) => void;
};

export const ProjectCtx = createContext<ProjectData | null>(null);

export function useProject(): ProjectData {
  const ctx = useContext(ProjectCtx);
  if (!ctx) throw new Error("useProject must be used inside a project route.");
  return ctx;
}
