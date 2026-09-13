# Interview slot picker for leadership applicants on Join Us

## Goal

Anyone applying for a Director or Associate Director role must pick an online
interview time when submitting the Join Us form. Regular member applications
are unaffected.

## Slot rules

- Date range: September 2 to September 12, 2026.
- Fridays (Sep 4, Sep 11) excluded (weekend).
- Sunday to Thursday: 12:00 to 13:00, in 10-minute steps
  (12:00, 12:10, ... 12:50 — 6 slots per day).
- Saturdays (Sep 5, Sep 12): 12:00 to 18:00, in 10-minute steps
  (36 slots per day).
- All times labelled as Riyadh time (GMT+3).
- A slot already taken by another applicant is shown greyed out and cannot
  be picked (prevents double booking).

## What changes

1. **Database** (migration)
   - Add an `interview_slot` timestamp column to `chapter_signups`
     (nullable — only leadership applicants fill it).
   - Unique index on `interview_slot` so the same slot can never be booked
     twice, enforced by the database itself.

2. **Shared slot logic** (`src/lib/interview-slots.ts`)
   - Generate the allowed dates and time lists from the rules above.
   - One source of truth used by the form (rendering options) and the server
     (validating the submitted slot is genuinely allowed).

3. **Join Us form** (`src/routes/join.tsx`)
   - When the selected role is any Director or Associate Director title,
     show a required "Interview slot (online)" section with two linked
     dropdowns: date first, then time (times filtered to that day's rule,
     taken slots disabled).
   - Helper text: "Interviews are online, Riyadh time (GMT+3). Booking
     closes September 12."
   - Validation: slot required only for leadership roles; cleared
     automatically if the applicant switches to a member role.
   - Success screen repeats the chosen date and time so the applicant has
     it on record.

4. **Server** (`src/lib/signups.functions.ts` / `signups.server.ts`)
   - Validate the slot server-side (in range, matches the day rule, not
     already taken); reject with a friendly error if the slot was grabbed
     while the form was open ("That slot was just taken — please pick
     another").
   - Provide a small public query returning the taken slots so the form can
     grey them out (returns only timestamps, no personal data).

5. **Admin dashboard** (`src/routes/admin.tsx`)
   - New "Interview" column showing the booked slot in Riyadh time
     (e.g. "Sun Sep 6, 12:20").
   - Added to the CSV export columns too.

## Notes / decisions baked in

- Leadership-only: member-role applicants never see the picker.
- Double booking is prevented (taken slots are greyed out, and the
  database enforces uniqueness as a backstop).
- After Sep 12 the range produces no dates; the picker then shows a short
  "booking has closed, we'll contact you to arrange a time" message instead
  of blocking the application.

## Out of scope (can be added later)

- Meeting-link tracking per interview in the admin page.
- Automatic calendar/invite emails to applicants.
