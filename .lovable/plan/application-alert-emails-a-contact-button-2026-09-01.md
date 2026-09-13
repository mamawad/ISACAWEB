# Application alert emails + a contact button

The sending domain `notify.auisaca.com` is verified and ready. Mail will go
out from `noreply@notify.auisaca.com` to `isaca@alfaisal.edu`.

## 1. Application alert emails

Replace the log-only placeholder in `notifySignup` with a real send. Every
Join Us submission triggers a branded email to `isaca@alfaisal.edu`
containing every field of the application: name, Alfaisal email, student
ID, ISACA ID, college, program, year of study, preferred team and role,
chosen interview slot (Riyadh time), phone, and reason for joining, plus a
link to `/admin`.

Sending stays best-effort: if mail fails, the application still saves and
the applicant still sees the confirmation. Failures are logged.

The recipient comes from the `NOTIFICATION_EMAIL` secret, which I'll
update to `isaca@alfaisal.edu`.

## 2. Contact button, bottom right

A small floating button pinned to the bottom-right corner of every page,
styled in the site's navy/teal palette with a mail icon and an "Email us"
label. Clicking it opens the visitor's email app with a message to
`isaca@alfaisal.edu` and a prefilled subject. It stays out of the way on
mobile and does not cover the form's submit button.

## Technical notes

- Email infrastructure is already verified for `notify.auisaca.com`; no
  further DNS work is needed.
- Scaffold the app email template registry and server-only send helper.
- New template `src/lib/email-templates/application-alert.tsx` rendering
  all submission fields; registered in the template registry.
- `notifySignup` in `src/lib/signups.server.ts` replaces its log-only
  placeholder with a real send using `sendLovableEmail`, with an
  idempotency key derived from the submission so retries do not duplicate.
  Recipient read from the `NOTIFICATION_EMAIL` secret, updated to
  `isaca@alfaisal.edu`.
- New `src/components/contact-fab.tsx` rendered once in
  `src/routes/__root.tsx`, using a `mailto:` link.

## Verification

- Submit a test application, confirm a `sent` event to
  `isaca@alfaisal.edu` in the delivery log, and you confirm it landed
  (check Junk the first time, then mark it "not junk").
- Contact button visible on all pages at desktop and mobile widths, and
  it opens a mail draft.
- Delete the test row afterwards.
