import { NATIONAL_DAY } from "@/lib/national-day";
import { cn } from "@/lib/utils";

/**
 * Slim bilingual greeting that sits above the site header during the
 * National Day season. Arabic set in Reem Kufi, right-to-left.
 */
export function NationalDayRibbon({
  className,
  compact = false,
}: {
  className?: string | undefined;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "nd-ribbon relative flex items-center justify-center gap-3 overflow-hidden text-white",
        compact ? "h-8 text-[11px]" : "h-9 text-xs",
        className,
      )}
    >
      <span className="nd-ribbon-shine" aria-hidden="true" />
      <span className="relative font-mono tracking-[0.2em] uppercase">
        Happy {NATIONAL_DAY.edition}th {NATIONAL_DAY.greetingEn}
      </span>
      <span className="relative h-1 w-1 rounded-full bg-[var(--ksa-gold)]" aria-hidden="true" />
      <span lang="ar" dir="rtl" className="font-arabic relative text-sm leading-none">
        {NATIONAL_DAY.greetingAr} {NATIONAL_DAY.editionAr}
      </span>
    </div>
  );
}
