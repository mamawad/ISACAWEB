# Fix: correct admin password doesn't let you in

## What's happening

The password is fine. Looking at the actual requests from your session, the login call came back **successful**, and then the very next call that loads the sign-ups came back **not authorized**, so the page bounced you back to the login screen.

The cause is the admin session cookie. It is currently set as `SameSite=Lax`. When the site is viewed inside the editor preview frame, the browser treats it as a third-party context and refuses to send a `Lax` cookie back on the next request. So the login succeeds, the cookie is set, and then it's never sent again.

(One of your attempts also used a different capitalization, which correctly failed. But the two attempts with the right password did authenticate.)

## The fix

1. Set the admin session cookie to `SameSite=None; Secure` so it survives the preview frame and normal browsing alike.
2. Make login not depend on a cookie round-trip at all: have the unlock call return the sign-up list in the same response, so the dashboard renders immediately after a correct password. The cookie then only handles "stay signed in across refreshes".
3. Clear the stale failed-attempt row for your address so no residual lockout counter is in the way.

## Technical detail

- `src/lib/admin.server.ts`: change `cookie.sameSite` from `"lax"` to `"none"` (keeps `httpOnly` and `secure: true`).
- `src/lib/signups.functions.ts`: `unlockAdmin` returns `{ ok, lockedMinutes, signups }` on success, fetching the rows right after `setAdminUnlocked()`.
- `src/routes/admin.tsx`: on successful unlock, use the returned `signups` instead of firing a second `listSignups` call. Session-restore on page load still uses `listSignups`.
- Delete the row in `public.admin_login_attempts` for the recorded address.
- Verify end to end in the preview: wrong password shows the error, correct password lands on the dashboard, refresh keeps the session.

No changes to rate limiting (5 attempts / 15 minute lockout), the password itself, or any page content.
