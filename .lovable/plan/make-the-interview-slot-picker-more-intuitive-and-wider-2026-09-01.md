# Make the interview slot picker more intuitive and wider

## Goal

The interview slot picker on the Join Us form is cramped and unclear. Dates
sit in a single narrow dropdown, and time buttons show only a start time
("12:00") with no hint that each slot is a 10-minute window. Rework the
picker so it uses the available width and makes the date+time choice obvious.

## Scope

Frontend only — `src/routes/join.tsx` plus a small helper in
`src/lib/interview-slots.ts`. No database or server changes. Slot data,
validation, taken-slot greying, and the success-screen confirmation all stay
as-is.

## Changes

1. **Time ranges instead of bare start times** (`src/lib/interview-slots.ts`)
   - Add a `timeRange` field to each slot (or a `slotRange(slot)` helper) that
     returns `"12:00–12:10"`. The end time is start + 10 minutes (the step),
     clamped to the day's window end. Use this for the time buttons and the
     "Selected" summary so applicants see the actual 10-minute block.

2. **Dates as a horizontal date strip, not a dropdown** (`src/routes/join.tsx`)
   - Replace the date `<Select>` with a horizontal row of date pills/buttons
     that wrap and use the full container width (e.g.
     `flex flex-wrap gap-2`). Each pill shows the weekday + day, e.g.
     `Sun 6`. Selected date is highlighted (accent fill), and the row reads
     as an obvious "pick your date" step with a clear label above it
     ("1. Choose a date").
   - This utilizes width instead of stacking one dropdown in a column.

3. **Clearer two-step labeling**
   - Label the date row "1. Choose a date" and the time grid
     "2. Choose a time (10-minute slots)" so the flow is unambiguous.
   - Keep the helper text: "Online · Riyadh time (GMT+3) · closes Sep 12".

4. **Time grid keeps its width, shows ranges**
   - Time buttons now show `timeRange` (e.g. "12:00–12:10"). Keep the existing
     responsive grid (`grid-cols-3 sm:grid-cols-4`), taken slots greyed out +
     disabled, selected slot filled with accent. Because labels are longer,
     widen buttons slightly and allow 2-line wrap so text never truncates.

5. **Selected summary**
   - The "Selected:" line below stays, now using the range label so the
     applicant confirms the full 10-minute window they booked.

## Out of scope

- No change to slot generation, server validation, the unique index, or the
  admin column (it already shows a Riyadh-time label).
- No change to when the picker appears (leadership roles only) or the
  "booking closed" fallback.
