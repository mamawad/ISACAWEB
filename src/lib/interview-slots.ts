/**
 * Interview slot rules for leadership (Director / Associate Director)
 * applicants on the Join Us form.
 *
 * Range: Sep 2 to Sep 30, 2026.
 * Saturdays only: 12:30–15:00 in 10-minute steps.
 * Exception: Sunday Sep 6 was also bookable, 12:30–15:00.
 * All times are Riyadh time (UTC+3, no DST).
 */

export const INTERVIEW_RANGE_START = "2026-09-02";
export const INTERVIEW_RANGE_END = "2026-09-30";

/** Extra bookable date outside the Saturday rule (12:30–15:00). */
const SUNDAY_EXCEPTION_DATE = "2026-09-06";

/** Riyadh is UTC+3 year-round (no daylight saving). */
const RIYADH_OFFSET_MINUTES = 180;

export type InterviewSlot = {
  /** Riyadh calendar date, YYYY-MM-DD */
  date: string;
  /** Riyadh weekday label, e.g. "Sun" */
  weekday: string;
  /** Riyadh time, HH:MM (24h) */
  time: string;
  /** 10-minute window, e.g. "12:00–12:10" */
  timeRange: string;
  /** Full label, e.g. "Sun Sep 6, 12:20 (Riyadh)" */
  label: string;
  /** UTC ISO timestamp stored in the database */
  iso: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDateYMD(ymd: string): Date {
  // Construct a UTC midnight so local TZ never shifts the day.
  const parts = ymd.split("-").map(Number);
  const y = parts[0]!;
  const m = parts[1]!;
  const d = parts[2]!;
  return new Date(Date.UTC(y, m - 1, d));
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse "HH:MM" into total minutes past midnight. */
function toMinutes(hhmm: string): number {
  const parts = hhmm.split(":").map(Number);
  const h = parts[0]!;
  const m = parts[1]!;
  return h * 60 + m;
}

function minutesToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Saturday offered window (Riyadh local, HH:MM). Slots are offered from
 * 12:30 to 15:00 in 10-minute steps. Edit here to change the window.
 */
const SATURDAY_WINDOW = {
  start: toMinutes("12:30"),
  end: toMinutes("15:00"),
  step: 10,
};

/** Day rule: returns the list of [start, end) windows for the 10-minute slots. */
function dayWindows(date: Date): { start: number; end: number; step: number }[] | null {
  if (ymd(date) === SUNDAY_EXCEPTION_DATE) {
    return [{ start: toMinutes("12:30"), end: toMinutes("15:00"), step: 10 }];
  }
  const dow = date.getUTCDay(); // 0 Sun .. 6 Sat
  if (dow !== 6) return null; // Saturdays only
  return [SATURDAY_WINDOW];
}

/** Convert a Riyadh date + HH:MM into a UTC ISO timestamp. */
function riyadhToUTCISO(ymd: string, hhmm: string): string {
  const parts = ymd.split("-").map(Number);
  const y = parts[0]!;
  const m = parts[1]!;
  const d = parts[2]!;
  const mins = toMinutes(hhmm);
  const utcMs =
    Date.UTC(y, m - 1, d, 0, 0, 0) + (mins - RIYADH_OFFSET_MINUTES) * 60_000;
  return new Date(utcMs).toISOString();
}

function monthDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** All allowed slots across the full booking range. */
export const ALL_INTERVIEW_SLOTS: InterviewSlot[] = buildSlots();

function buildSlots(): InterviewSlot[] {
  const slots: InterviewSlot[] = [];
  const start = parseDateYMD(INTERVIEW_RANGE_START);
  const end = parseDateYMD(INTERVIEW_RANGE_END);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const windows = dayWindows(d);
    if (!windows || windows.length === 0) continue;
    const dateStr = ymd(d);
    const weekday = WEEKDAYS[d.getUTCDay()]!;
    const dayLabel = monthDayLabel(d);
    for (const window of windows) {
      for (let mins = window.start; mins < window.end; mins += window.step) {
        const time = minutesToHHMM(mins);
        const timeRange = `${minutesToHHMM(mins)}–${minutesToHHMM(
          Math.min(mins + window.step, window.end),
        )}`;
        slots.push({
          date: dateStr,
          weekday,
          time,
          timeRange,
          label: `${weekday} ${dayLabel}, ${time} (Riyadh)`,
          iso: riyadhToUTCISO(dateStr, time),
        });
      }
    }
  }
  return slots;
}

/**
 * Slots starting within this many minutes are no longer offered, so nobody
 * books an interview that begins in a few minutes.
 */
export const BOOKING_LEAD_MINUTES = 30;

/** Slots still in the future (past ones drop off automatically). */
export function upcomingSlots(now: number = Date.now()): InterviewSlot[] {
  const cutoff = now + BOOKING_LEAD_MINUTES * 60_000;
  return ALL_INTERVIEW_SLOTS.filter((s) => Date.parse(s.iso) > cutoff);
}

/** Distinct bookable dates still in the future, in order. */
export function upcomingDates(
  now: number = Date.now(),
): { date: string; weekday: string; label: string }[] {
  const seen = new Map<string, { date: string; weekday: string; label: string }>();
  for (const s of upcomingSlots(now)) {
    if (!seen.has(s.date)) {
      const d = parseDateYMD(s.date);
      seen.set(s.date, {
        date: s.date,
        weekday: s.weekday,
        label: `${s.weekday} ${monthDayLabel(d)}`,
      });
    }
  }
  return [...seen.values()];
}

/** Slots available for a given Riyadh date (YYYY-MM-DD), future ones only. */
export function slotsForDate(date: string): InterviewSlot[] {
  return upcomingSlots().filter((s) => s.date === date);
}

/** True when a slot ISO timestamp is an allowed slot that has not passed. */
export function isValidSlotISO(iso: string): boolean {
  return upcomingSlots().some((s) => s.iso === iso);
}


/** Human label for a stored ISO timestamp (Riyadh time). */
export function labelSlotISO(iso: string): string {
  const slot = ALL_INTERVIEW_SLOTS.find((s) => s.iso === iso);
  if (slot) return slot.label;
  // Fallback: format the instant as Riyadh time.
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const riyadh = new Date(d.getTime() + RIYADH_OFFSET_MINUTES * 60_000);
  const weekday = WEEKDAYS[riyadh.getUTCDay()];
  const day = riyadh.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const time = riyadh.toISOString().slice(11, 16);
  return `${weekday} ${day}, ${time} (Riyadh)`;
}

/** Range label for a stored ISO timestamp, e.g. "Sun Sep 6, 12:00–12:10 (Riyadh)". */
export function labelSlotRangeISO(iso: string): string {
  const slot = ALL_INTERVIEW_SLOTS.find((s) => s.iso === iso);
  if (slot) {
    const day = monthDayLabel(parseDateYMD(slot.date));
    return `${slot.weekday} ${day}, ${slot.timeRange} (Riyadh)`;
  }
  return labelSlotISO(iso);
}

/**
 * Whether a preferred-role title counts as leadership and therefore requires
 * an interview slot. Derived from the team definitions so it stays in sync.
 */
export function isLeadershipRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return /director/i.test(role);
}

/** True once the booking window has fully passed (no future slots remain). */
export function bookingClosed(now: number = Date.now()): boolean {
  return upcomingSlots(now).length === 0;
}
