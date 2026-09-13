# Fix: alert emails only arrive for some applications

Emails have not stopped completely. Checking the delivery log against the
applications actually stored shows most applications did send an alert, but
several did not. Of the last 15 applications, 6 produced no email at all:

- Sep 5, 08:51 - Mais Najmeddin
- Sep 4, 21:32 - Sadia Islam
- Sep 4, 19:44 - Leena Memish
- Sep 4, 18:40 - Raneem Alkahtani
- Sep 4, 16:35 - Faisal Alshehri
- Sep 4, 16:23 - Layan AlYahya

Nothing is lost: every one of those applications is safely in the database and
visible at /admin. Only the alert email is missing. The sending domain is
verified and healthy, nothing was blocked, rate limited, or bounced, and no
address is on a block list.

The cause is not yet confirmed (the server keeps only one hour of logs, and no
application came in during that hour). The most likely explanation is that the
alert is sent while the applicant's submit request is still open: if that
request is cut short (the applicant closes the tab or loses signal right after
submitting) or the mail service hiccups once, the email silently never happens
and nobody finds out. That fits the pattern of random gaps rather than a clean
stop.

## The fix

1. Record, per application, whether its alert email actually went out. A new
   "notified" marker is written only after a successful send.
2. Make the send survive the applicant leaving the page, so a closed tab can no
   longer cancel it, and retry once on a transient failure.
3. Log failures loudly with the applicant's name and the reason, so the next
   gap is diagnosable instead of invisible.
4. Add a "Not emailed" indicator and a "Resend alert" button per row in /admin,
   plus a one-click "Send all missing alerts" so you can catch up any gap
   yourself.
5. Send the six missing alerts above so you get their details by email.

## Technical notes

- Migration: add `notified_at timestamptz` to `public.chapter_signups`
  (nullable, no backfill so existing gaps stay visible). Existing grants and
  RLS unchanged; the column is only read/written through the service-role
  admin path and the server-side signup handler.
- `submitSignup` in `src/lib/signups.functions.ts`: keep the insert first,
  then run the notification without blocking the response using the request
  waitUntil context, so the Worker does not tear down mid-send. Insert returns
  the new row id, used for both the notified marker and the idempotency key.
- `notifySignup` in `src/lib/signups.server.ts`: retry once after a short
  delay when `sendLovableEmail` throws a transient error (non-`EmailAPIError`
  or 5xx), skip retry for `recipient_suppressed`, `domain_not_verified`,
  `emails_disabled`, and 429 (which should wait `retryAfterSeconds`). On
  success stamp `notified_at`; on final failure log
  `[chapter-signup] alert failed for <email>: <code>`.
- Idempotency key moves to `signup-alert-<row id>` so retries and manual
  resends dedupe correctly per application rather than per person.
- New session-gated server functions `resendSignupAlert(id)` and
  `resendMissingAlerts()` in `src/lib/signups.functions.ts`, wired to buttons
  in `src/routes/admin.tsx` next to the existing delete action, with a small
  "Not emailed" badge on rows where `notified_at` is null.

## Verification

- Submit a test application, confirm a `sent` event in the delivery log and a
  "notified" state on the row, then delete the test row.
- Run "Send all missing alerts" and confirm six emails arrive for the names
  above.
- Confirm the admin list shows no "Not emailed" rows afterwards.
