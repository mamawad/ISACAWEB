# Narrow interview slots to Saturdays plus Sunday Sep 6

## New booking rules

- Saturdays only, from September 5 through the end of September:
  Sep 5, Sep 12, Sep 19, Sep 26 — 12:00 to 18:00, in 10-minute slots.
- One exception: Sunday September 6, 12:00 to 13:00, in 10-minute slots.
- No other weekdays are bookable.
- All times stay Riyadh time (GMT+3).

## What changes

Only `src/lib/interview-slots.ts`:

- Extend the booking range end to September 30, 2026.
- Replace the day rule: a date is bookable only if it is a Saturday
  (12:00–18:00) or exactly 2026-09-06 (12:00–13:00).

Everything else follows automatically since the form, server validation and
admin column all read from this one list: the date pills on the Join Us form
will show only those dates, and server-side validation rejects anything else.

## Not changed

- Slot length (10 minutes), the greying out of taken slots, double-booking
  protection, who sees the picker (Director / Associate Director applicants),
  the admin dashboard column and CSV export.
- Any interview already booked on a date that is no longer offered stays in
  the database and still shows in the admin list; it just can't be picked by
  new applicants.

## Helper text

Update the note under the picker to "Online · Riyadh time (GMT+3) · closes
Sep 30".
