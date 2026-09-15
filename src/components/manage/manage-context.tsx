import { createContext, useContext } from "react";
import type { ManageContext, Permission } from "@/lib/pm/permissions";
import { hasPermission } from "@/lib/pm/permissions";

export const ManageCtx = createContext<ManageContext | null>(null);

/** The signed-in workspace user. Only valid under the /manage layout. */
export function useManage(): ManageContext {
  const ctx = useContext(ManageCtx);
  if (!ctx) throw new Error("useManage must be used inside the /manage layout.");
  return ctx;
}

export function useCan(): (perm: Permission) => boolean {
  const ctx = useManage();
  return (perm) => hasPermission(ctx, perm);
}
