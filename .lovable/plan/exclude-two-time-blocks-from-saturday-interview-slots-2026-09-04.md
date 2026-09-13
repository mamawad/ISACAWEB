# Exclude two time blocks from Saturday interview slots

## New Saturday rules

On Saturdays, keep the 12:00–18:00 window in 10-minute slots, but skip two blocks:

- 12:00–12:30 (so the first available slot starts at 12:30)
- 15:20–16:00 (no slots from 15:20 up to 16:00)

That leaves these Saturday slot ranges:

- 12:30–15:20 (12:30, 12:40, … 15:10)
- 16:00–18:00 (16:00, 16:10, … 17:50)

The Sunday Sep 6 exception (12:00–13:00) is unchanged.

## What changes

Only `src/lib/interview-slots.ts`:

- Make `dayWindow` return a list of windows instead of a single window (or filter excluded ranges out of the Saturday window).
- Add the two excluded ranges as constants so they're easy to edit later.
- `buildSlots` iterates each window's `[start, end)` in 10-minute steps.

Everything else follows automatically: the Join Us date pills and time grid, server-side validation, the admin Interview column, and CSV export all read from the generated slot list, so already-booked interviews on excluded times stay visible but new applicants can't pick them.

## Not changed

- Slot length (10 minutes), the Sunday Sep 6 exception, double-booking protection, leadership-only gating, the admin dashboard, helper text ("closes Sep 30"), and Riyadh time (GMT+3) labels.
