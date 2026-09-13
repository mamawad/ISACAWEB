# Email notifications for every sign-up, and a harder /admin gate

Two separate issues, both real:

1. **Email alerts are not actually sending.** The code has a notification step,
   but it currently only writes a line to the server log, because no sending
   email domain has ever been configured for this project. So far nothing has
   been emailed to `tba_AU_StudentChapter@hotmail.com`. No sign-ups were lost:
   every submission is safely stored in the database and visible at `/admin`.
2. **`/admin` is behind a single shared password**, and you do not currently
   know it. That needs to be fixed and hardened.

## 1. Turn on real email alerts

To send mail, the project needs a verified sending domain. You own
`auisaca.com`, so the sender becomes something like
`noreply@auisaca.com`, and the recipient stays
`tba_AU_StudentChapter@hotmail.com` (backend only, never printed anywhere on
the site).

Steps:

- You open the email setup dialog and add `auisaca.com`, then add the DNS
  records it gives you at your domain registrar. Verification is usually
  minutes.
- Once verified, replace the placeholder in `src/lib/signups.server.ts` with a
  real send: a plain, readable email containing every field of the submission
  (name, Alfaisal email, student ID, ISACA ID, college, program, year,
  preferred team and role, phone, and their reason), plus a link to `/admin`.
- Sending stays best-effort: if the mail provider is down, the sign-up still
  saves and the applicant still sees the confirmation. Failures get logged.
- Test by submitting a dummy application and confirming the email arrives at
  the Hotmail address, then delete the test row.

Note: Hotmail/Outlook sometimes files first-time senders under Junk. After the
first test, mark it "not junk" and add the sender to your contacts.

## 2. Make /admin properly safe

Answering the question directly: today the only thing standing between a
stranger and the sign-up list is one password, checked on the server. The
password is never sent to the browser and the comparison is timing-safe, and
the database itself refuses all public reads (the table has no read policy at
all), so the data cannot be pulled directly. But a single password with
unlimited guesses is genuinely weak if it is short. Three changes fix that:

**a. You get a strong password you actually know.**
Generate a long random password, store it as the `ADMIN_PASSWORD` secret, and
show it to you once so you can save it in your password manager. Nothing about
it is guessable.

**b. Rate limiting on wrong guesses.**
After 5 failed attempts from the same address, lock out further attempts for
15 minutes. This makes brute-force guessing impractical even if the password
were weak. Attempts are tracked server side in a small `admin_login_attempts`
table so the limit survives restarts.

**c. Stay-logged-in via a secure session cookie.**
Right now the password is re-sent with every action and the page forgets you
on refresh. Switch to an encrypted, http-only session cookie: enter the
password once, stay unlocked for 7 days on that device, and the "Lock" button
clears it. The password stops travelling with each request.

Also: `/admin` already tells search engines not to index it, and it is not
linked from anywhere on the site.

## What stays the same

- Applications continue to be stored in the database and listed at `/admin`.
- The notification address is used only on the server. It never appears on any
  page, footer, or mailto link.
- The CSV export previously discussed is still worth adding; it is not part of
  this plan and can follow right after.

## Technical notes

- Migration: `admin_login_attempts` (ip text, attempts int, locked_until
  timestamptz, updated_at timestamptz), RLS enabled with no public policies,
  `GRANT ALL ... TO service_role` only. Written and read via the service-role
  path inside the server function.
- New secret `SESSION_SECRET` (32+ chars, generated) for cookie encryption;
  `ADMIN_PASSWORD` regenerated and shown to you once.
- `src/lib/signups.functions.ts`: `unlockAdmin` (password + rate limit ->
  session), `lockAdmin` (clear session), and `listSignups` changed to read the
  session rather than take a password argument.
- `src/routes/admin.tsx`: password form calls `unlockAdmin`; the list is loaded
  from the session-gated function; "Lock" calls `lockAdmin`.
- `src/lib/signups.server.ts`: real email send in `notifySignup`, reading the
  recipient from the existing `NOTIFICATION_EMAIL` secret.

## Verification

- Submit a test application; confirm the email lands at the Hotmail address and
  the row appears in `/admin`; then delete the test row.
- Six wrong passwords in a row triggers the lockout message.
- Correct password unlocks, and a page refresh keeps you unlocked; "Lock"
  signs you out.
