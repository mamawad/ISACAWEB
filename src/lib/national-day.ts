/**
 * Saudi National Day theme. The whole site switches into it automatically
 * during the celebration window and back out afterwards — no redeploy needed.
 *
 * Deliberately does not render the Saudi flag or the official National Day
 * identity: the flag carries the Shahada and is not used decoratively, and
 * the yearly logo belongs to the General Entertainment Authority. The theme
 * is built from the national green, white, palm and Sadu-weave geometry.
 */

/** 23 September 1932 unification; 2026 is the 96th National Day. */
export const NATIONAL_DAY = {
  edition: 96,
  editionAr: "٩٦",
  date: "2026-09-23",
  /** Inclusive window, Riyadh dates. */
  from: "2026-09-16",
  until: "2026-10-07",
  greetingAr: "اليوم الوطني السعودي",
  greetingEn: "Saudi National Day",
} as const;

/**
 * Force the theme on or off regardless of the date. Leave null to follow
 * the window above.
 */
export const NATIONAL_DAY_OVERRIDE: boolean | null = null;

/** Today's date in Riyadh as YYYY-MM-DD. */
function riyadhToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isNationalDaySeason(now: Date = new Date()): boolean {
  if (NATIONAL_DAY_OVERRIDE !== null) return NATIONAL_DAY_OVERRIDE;
  const today = riyadhToday(now);
  return today >= NATIONAL_DAY.from && today <= NATIONAL_DAY.until;
}

export function isNationalDayToday(now: Date = new Date()): boolean {
  return riyadhToday(now) === NATIONAL_DAY.date;
}
