# Build the Join Us form + backend (the core conversion page)

The shell, Home, Mission, Events, Team, and logo are all done. The one
remaining piece from the v1 spec is the **Join Us** page — the site's whole
purpose. It's currently a placeholder (`src/routes/join.tsx`), and Lovable
Cloud isn't enabled yet. This plan builds it end-to-end.

## Prerequisites (run first, in order)

1. **Enable Lovable Cloud** — needed for the database, the admin auth, and
   email. Confirm once enabled before building.
2. **Create the `chapter_signups` table** via a SQL migration. Schema:

```sql
create table public.chapter_signups (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  student_id text not null,
  major text not null,
  year_of_study text not null,
  phone text,
  reason text,
  created_at timestamptz not null default now()
);

-- Required grants (PostgREST needs them; RLS alone is not enough)
grant select, insert on public.chapter_signups to anon;
grant all on public.chapter_signups to service_role;

alter table public.chapter_signups enable row level security;

-- Public can submit a signup (insert only)
create policy "Anyone can submit a signup"
  on public.chapter_signups for insert
  to anon
  with check (true);

-- No public reads — only the admin (service_role) reads rows.
```

Anon gets **insert only**; no anon SELECT, so the form is public but the
data is private. The admin page reads via a server function using the
service-role client (bypasses RLS).

3. **Store the notification email + admin password as Cloud secrets**:
   - `NOTIFICATION_EMAIL` = `tba_AU_StudentChapter@hotmail.com`
     (backend-only; never shown on the site)
   - `ADMIN_PASSWORD` = a value the user picks (for the `/admin` login)
   - `SMTP`/email send is handled through Lovable Email (Cloud feature).

## What changes

### A. Join Us form — `src/routes/join.tsx` (replace placeholder)

- Real in-page form (not a redirect), matching the spec fields:
  - Full name, Email, Student ID, Major/program, Year of study (select),
    Phone number, "Why do you want to join?" (textarea).
- On submit: call a server function that inserts into
  `chapter_signups`, sends the email alert, and returns success.
- On success: show an on-screen confirmation ("Thanks — we'll be in
  touch") and clear the form. Validate required fields client-side and
  server-side (Zod).
- Layout: reuse `hero-surface` header + a single-column form card
  (`bg-card`) consistent with the rest of the site.

### B. Server function — `src/lib/signups.functions.ts`

- `submitSignup(input)` — validate with Zod, insert into
  `chapter_signups` using the **publishable** (anon) client, send the
  email notification, return `{ ok: true }`. Public (no auth) — anyone
  can submit. Read `NOTIFICATION_EMAIL` inside the handler.
- `listSignups()` — protected with `requireSupabaseAuth`? No: the admin
  uses a simple password, not Supabase user auth. Instead, this function
  takes the password, checks it against `ADMIN_PASSWORD` server-side,
  and only then reads all rows via the **service-role** client (bypasses
  RLS). Returns the list for the admin table.

### C. Email notification — on each signup

- Use Lovable Email (Cloud) to send to `NOTIFICATION_EMAIL` with the
  signup details. Address is backend-only — **never** rendered on any
  page, footer, or mailto link.

### D. `/admin` page — `src/routes/admin.tsx`

- Simple password gate (single input → calls `listSignups` with the
  password). No Supabase user accounts for this.
- On success: a table listing all signups (name, email, student ID,
  major, year, phone, reason, timestamp).
- Not linked in the nav — reachable only by direct URL, intentionally
  low-profile.
- Server-side validation of the password (constant-time compare); reject
  with 401-style error on mismatch.

### E. Nav

- Add "Join Us" to the header nav as a prominent CTA button (not just a
  text link), per the spec ("linked prominently from Home").
- The `/admin` route is NOT added to nav.

## Out of scope

- Real event dates / officer photos (still pending user input).
- Custom domain (later, when purchased).

## Verification

- `/join` renders the form; submitting a test row inserts into
  `chapter_signups` and shows the confirmation.
- Email arrives at the notification address.
- `/admin` rejects a wrong password; with the right one, lists all rows.
- Screenshots of desktop + mobile for `/join` and `/admin`.
