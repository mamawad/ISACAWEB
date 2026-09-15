import { useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getManageContext } from "@/lib/pm/auth.functions";
import { ManageCtx } from "@/components/manage/manage-context";
import { ManageShell } from "@/components/manage/shell";

/**
 * Private workspace. Not linked from the public site and disallowed in
 * robots.txt. The guard runs on every load: no session → /manage/login.
 */
export const Route = createFileRoute("/manage")({
  beforeLoad: async ({ location }) => {
    const manage = await getManageContext();
    const path = location.pathname.replace(/\/+$/, "");
    const isLogin = path === "/manage/login";
    if (!manage && !isLogin) {
      throw redirect({
        to: "/manage/login",
        search: path === "/manage" ? {} : { next: path },
      });
    }
    if (manage && isLogin) {
      throw redirect({ to: "/manage" });
    }
    return { manage };
  },
  head: () => ({
    meta: [
      { title: "Workspace · ISACA Alfaisal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ManageLayout,
});

function ManageLayout() {
  const { manage } = Route.useRouteContext();

  // The marketing site is dark; the workspace is light. Flip the root class
  // so shadcn dark: variants stay off while we are here.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  if (!manage) return <Outlet />;

  return (
    <ManageCtx.Provider value={manage}>
      <ManageShell>
        <Outlet />
      </ManageShell>
    </ManageCtx.Provider>
  );
}
