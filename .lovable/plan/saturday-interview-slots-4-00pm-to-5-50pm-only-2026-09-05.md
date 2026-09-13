# Saturday interview slots: 4:00pm to 5:50pm only

## Goal

On Saturdays, offer interview slots only from 16:00 to 17:50 (Riyadh), in
10-minute steps (16:00, 16:10, ... 17:40 — 12 slots). Remove the current
12:30–15:20 and 16:00–18:00 Saturday windows entirely.

Sunday Sep 6 (12:00–13:00) is unchanged. All other rules are unchanged.

## What changes

Only `src/lib/interview-slots.ts`:

- Replace the Saturday branch in `dayWindows` so it returns a single
  window `{ start: 16:00, end: 17:50, step: 10 }`.
- Remove (or stop using) the `SATURDAY_EXCLUDED_RANGES` constant and the
  subtraction logic, since the new single window already encodes the only
  offered times. Keep the file readable.

Everything else follows automatically from the generated slot list: the
Join Us date pills and time grid, server-side validation, the admin
Interview column, and CSV export. Already-booked interviews outside the
new window stay in the database and still show in the admin list; new
applicants simply can't pick them.

## Not changed

- Slot length (10 minutes), the Sunday Sep 6 exception, double-booking
  protection, leadership-only gating, the admin dashboard, helper text
  ("closes Sep 30"), and Riyadh time (GMT+3) labels.
