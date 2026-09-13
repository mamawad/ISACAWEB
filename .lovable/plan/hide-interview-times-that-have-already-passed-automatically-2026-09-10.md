# Hide interview times that have already passed, automatically

## Goal

Applicants should only ever see interview times still in the future. No manual editing each week: the site works this out from the current clock every time someone opens the form.

## How it works

- The full list of allowed times stays exactly as today (Saturdays 16:00–17:50, plus Sunday Sep 6 12:00–13:00, Riyadh time).
- Whenever the Join Us page shows dates or times, it filters out anything whose start time is already in the past, plus a small buffer (times starting within the next 30 minutes are also hidden, so nobody books a slot that begins in 5 minutes).
- A date whose times have all passed disappears from the date row entirely.
- Once every remaining time has passed, the page shows the existing "booking has closed, we'll contact you to arrange a time" message.
- Already-booked interviews stay visible in the admin dashboard and the export, even after their time passes. Nothing is deleted from the database.

## Autonomy

This is self-maintaining: it is computed from the current time on each page load and each submission, so no scheduled job, no cron, and no manual clean-up is needed.

## Technical detail

In `src/lib/interview-slots.ts`:

- Keep `ALL_INTERVIEW_SLOTS` as the full generated list (still used for labelling stored bookings).
- Add `BOOKING_LEAD_MINUTES = 30` and `upcomingSlots(now = Date.now())` returning slots with `Date.parse(iso) > now + lead`.
- Change `INTERVIEW_DATES` from a module constant to `upcomingDates()`, derived from `upcomingSlots()`.
- `slotsForDate(date)` filters `upcomingSlots()` instead of the full list.
- `isValidSlotISO(iso)` validates against `upcomingSlots()` so a stale form can't submit a passed time; the schema in `src/lib/signups.schema.ts` picks this up unchanged and returns the existing validation error.
- `bookingClosed()` becomes `upcomingSlots().length === 0`.

In `src/routes/join.tsx`:

- Call `upcomingDates()` inside the component (memoised) instead of importing the constant.
- If the applicant's already-picked date/time falls out of the list after a refresh, clear it and prompt to pick again.
- Guard against SSR/client mismatch by computing the list after mount so the server-rendered and browser lists agree.

Labels for stored bookings (`labelSlotISO`, `labelSlotRangeISO`) keep reading the full list, so past interviews still display properly in `/admin` and the CSV export.
