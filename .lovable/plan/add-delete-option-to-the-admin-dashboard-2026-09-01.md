# Add delete option to the admin dashboard

## What you'll see

On `/admin`, each sign-up row gets a small trash icon at the end of the row. Clicking it asks for confirmation (showing the applicant's name so you can't mix rows up), then permanently removes that application from the table and the database. The entry count updates immediately, and if the deleted applicant had booked an interview slot, that slot automatically becomes available again on the Join Us form.

Deleting is permanent — there is no undo. The CSV export stays unchanged, so you can always download a backup before cleaning up entries.

## Technical details

- `src/lib/signups.functions.ts`: add a `deleteSignup` server function that:
  - Checks the encrypted admin session cookie first (`isAdminUnlocked`), same gate as `listSignups` — no session, no delete.
  - Takes the signup `id` (validated as a UUID), deletes the row via the existing service-role server helper.
- `src/lib/signups.server.ts`: add a `deleteSignupRecord(id)` helper using the service-role client (RLS on `chapter_signups` denies DELETE, so this stays server-side only).
- `src/routes/admin.tsx`:
  - Add a final table column with a trash icon button per row.
  - Confirmation dialog (name + email shown) before deleting; per-row loading spinner while the delete is in flight.
  - On success, remove the row from local state and show a toast.
- Interview slots need no extra work: they live on the row, so deleting the row frees the slot.
- Verify: sign in to `/admin` in the preview, delete a test entry, confirm it's gone and no longer appears after refresh.
