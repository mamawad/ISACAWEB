# Add an optional ISACA ID field to the Join Us form

The Join Us form collects sign-up data into `chapter_signups`. Today the
table and form have no ISACA ID field. The ISACA ID is a 7-digit code that
starts with `2` (e.g. `2000000`), and it should be **optional** on the form.

## What changes

### A. Database migration — add `isaca_id` column

Add a nullable `isaca_id text` column to `public.chapter_signups`.

```sql
alter table public.chapter_signups
  add column isaca_id text;
```

No grant/RLS changes needed: the existing table grants (anon INSERT, no anon
SELECT) and the `with check (true)` insert policy already cover a new
nullable column. Existing rows get `NULL`; the form only sends a value when
the user fills it in.

### B. Schema — `src/lib/signups.schema.ts`

- Add `isaca_id` to `signupSchema`: optional, trimmed, and when present must
  match `^2\d{6}$` (exactly 7 digits, starts with 2). Empty string → treated
  as not provided (`null`).
- Add `isaca_id: string | null` to the `SignupRow` type.

### C. Server helpers — `src/lib/signups.server.ts`

- `createSignupRecord`: insert `isaca_id` (value or `null`).
- `fetchAllSignups`: add `isaca_id` to the `select(...)` column list.

### D. Join Us form — `src/routes/join.tsx`

- Add `isaca_id: ""` to the `EMPTY` form state.
- Add an `ISACA ID` field, marked optional (hint "Optional"). Use a text
  `Input` with `inputMode="numeric"`, `maxLength={7}`,
  `placeholder="e.g. 2000000"`. Place it near Student ID (two-column row
  with Student ID, or just below the major field — see note).
- Client-side validation: if filled, must be 7 digits starting with 2;
  otherwise show "ISACA ID must be a 7-digit code starting with 2.".

### E. Admin table — `src/routes/admin.tsx`

- Add an `ISACA ID` column header and cell (`{s.isaca_id ?? "—"}`), placed
  after Student ID.

## Validation rule (shared client + server)

- Empty → allowed (optional).
- Non-empty → must match `^2\d{6}$`.

## Verification

- Submit the form with the field empty → succeeds, row saved with `null`.
- Submit with a valid ID (e.g. `2000000`) → succeeds, row saved with it.
- Submit with an invalid value (e.g. `1234567` or `20000`) → client-side
  error blocks submit; server-side Zod also rejects if reached.
- `/admin` (correct password) shows the new column populated.
