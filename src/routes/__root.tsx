import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactFab } from "@/components/contact-fab";
import { ScrollProgress } from "@/components/fx/scroll-progress";
import { GhostCta, PrimaryCta } from "@/components/fx/cta";
import { Toaster } from "@/components/ui/sonner";
import { SITE } from "@/lib/site";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function NotFoundComponent() {
  return (
    <div className="relative mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-4 pt-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 font-display text-8xl font-extrabold tracking-tight">
        <span className="text-gradient">404</span>
      </h1>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8">
        <PrimaryCta to="/">Go home</PrimaryCta>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="relative mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-4 pt-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
        This page did not load
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong on our end. You can try refreshing or head back home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="btn btn-primary"
        >
          <span className="relative">Try again</span>
        </button>
        <GhostCta to="/">Go home</GhostCta>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE.name },
      {
        name: "description",
        content:
          "The ISACA Student Chapter at Alfaisal University connects students with IT governance, risk, cybersecurity, and audit. Join the community.",
      },
      { name: "author", content: SITE.name },
      { name: "theme-color", content: "#0b1220" },
      { property: "og:title", content: SITE.name },
      {
        property: "og:description",
        content:
          "A student-led community at Alfaisal University for IT governance, risk, cybersecurity, and audit. Join us.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/brand/isaca-lockup.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/** Soft cross-fade between routes. Keyed on pathname so each page enters fresh. */
function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isWorkspace = pathname === "/manage" || pathname.startsWith("/manage/");

  // The private workspace has its own chrome and theme; keep the marketing
  // header/footer/FAB out of it entirely.
  if (isWorkspace) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="manage-theme min-h-screen">
          <Outlet />
        </div>
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:rounded-full focus:bg-brand-teal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-deep"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <SiteHeader />
      <div className="flex min-h-screen flex-col">
        <main id="main" className="flex-1">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <SiteFooter />
      </div>
      <ContactFab />
      <Toaster />
    </QueryClientProvider>
  );
}
