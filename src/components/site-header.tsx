import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowUpRight, Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { NationalDayRibbon } from "@/components/national-day/ribbon";
import { useNationalDay } from "@/components/national-day/use-national-day";

const NAV = [
  { to: "/mission", label: "Mission" },
  { to: "/events", label: "Events" },
  { to: "/team", label: "Team" },
] as const;

function Wordmark({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className="group flex items-center gap-3"
      aria-label={`${SITE.name} — home`}
    >
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-105">
        <img src="/brand/isaca-square.png" alt="" className="h-8 w-8 object-contain" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-sm font-bold tracking-tight text-foreground">ISACA</span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Alfaisal Chapter
        </span>
      </span>
    </Link>
  );
}

function NavLinks({
  onNavigate,
  vertical = false,
}: {
  onNavigate?: (() => void) | undefined;
  vertical?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex",
        vertical ? "flex-col gap-1" : "items-center gap-1 rounded-full bg-white/[0.04] p-1",
      )}
    >
      {NAV.map((link) => {
        const active = pathname === link.to || pathname.startsWith(`${link.to}/`);
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={cn(
              "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
              vertical && "px-4 py-3 text-base",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && !vertical ? (
              <motion.span
                layoutId="nav-active"
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-white/10"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span className="relative">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Floating glass pill. Turns solid once the page scrolls, and slips out of
 * the way while scrolling down so the content gets the full viewport.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const reduce = useReducedMotion();
  const { active: nationalDay } = useNationalDay();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > prev && y > 160 && !open);
  });

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? (nationalDay ? -140 : -100) : 0 }}
      transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-40 flex flex-col items-center"
    >
      {nationalDay ? <NationalDayRibbon className="w-full" /> : null}
      <div className="flex w-full justify-center px-4 pt-4 sm:px-6">
        <div
          className={cn(
            "flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-full pr-2 pl-4 transition-[background-color,box-shadow,border-color] duration-300",
            scrolled
              ? "glass shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]"
              : "border border-transparent",
          )}
        >
          <Wordmark />

          <div className="hidden items-center gap-3 md:flex">
            <NavLinks />
            <Link to="/join" className="btn btn-primary btn-sm group">
              <span className="relative">Join Us</span>
              <ArrowUpRight
                aria-hidden="true"
                className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px"
              />
            </Link>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-white/10"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="glass-strong w-[86vw] max-w-sm border-white/10 p-6"
              >
                <SheetTitle className="sr-only">{SITE.name}</SheetTitle>
                <Wordmark onNavigate={() => setOpen(false)} />
                <div className="mt-8 flex flex-col gap-2">
                  <NavLinks vertical onNavigate={() => setOpen(false)} />
                  <SheetClose asChild>
                    <Link to="/join" className="btn btn-primary mt-4">
                      Join Us
                    </Link>
                  </SheetClose>
                </div>
                <div className="mt-10 border-t border-white/10 pt-6">
                  <p className="eyebrow">Follow</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {SITE.socials.map((s) => (
                      <li key={s.label}>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {s.label}
                          <span className="font-mono text-xs">{s.handle}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
