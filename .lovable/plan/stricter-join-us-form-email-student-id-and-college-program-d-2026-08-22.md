# Stricter Join Us form: email, student ID, and college/program dropdowns

Tighten validation on the sign-up form and replace the free-text "Major / program"
field with two linked dropdowns (College, then Program) so the admin export is
clean and filterable in Excel.

## 1. Email must be an Alfaisal address

- Accept only addresses ending in `@alfaisal.edu` (case-insensitive, stored lowercase).
- Error message: "Please use your Alfaisal email address (ending in @alfaisal.edu)."
- Enforced both in the form and in the server-side schema.

## 2. Student ID: 6 or 9 digits

- Digits only, exactly 6 or 9 characters.
- Error message: "Student ID must be 6 or 9 digits."
- Placeholder updated to `e.g. 202412345`.
- Input restricted to numeric entry, max 9 characters.

## 3. ISACA ID stays optional

No change: optional, and when filled must be 7 digits starting with 2.

## 4. Phone number stays optional

No change.

## 5. College and Program dropdowns (replaces free-text major)

Two selects: picking a College filters the Program list. Every college also
offers "Other" with a short text box for anything not listed.

**College of Engineering and Advanced Computing**
Architecture, Architectural Engineering, Artificial Intelligence, Biomedical
Engineering, Cybersecurity, Data Science, Electrical Engineering, Industrial
Engineering, Mechanical Engineering, Software Engineering, Other

**College of Business**
Finance, Management, Human Resources, Marketing, Business Analytics,
Accounting, Project Management, Entrepreneurship, Other

**College of Law and International Relations**
Law and International Relations (LLB), Other

**College of Medicine**
Medicine and Surgery (MBBS), Other

Plus a top-level "Other" college option with a free-text program box, so no
student is blocked from signing up.

Program lists are drawn from Alfaisal's published undergraduate catalog and are
kept in one file, so adding or renaming a program later is a one-line change.

## 6. Admin table

- Replace the single "Major" column with "College" and "Program".
- Existing sign-ups keep their original free-text major: it shows under Program
  with the College cell reading "Not specified", so no old data is lost.

## Technical notes

- Migration: add nullable `college text` and `program text` columns to
  `public.chapter_signups`; keep the existing `major` column and continue
  writing the chosen program into it for backwards compatibility with old rows
  and any existing export. No RLS or grant changes needed (nullable columns on
  an existing table).
- `src/lib/signups.schema.ts`: add the `COLLEGES` constant (college to program
  list map), tighten `email` (`.endsWith("@alfaisal.edu")` refinement, lowercased),
  tighten `student_id` (`/^(\d{6}|\d{9})$/`), replace `major` with
  `college` + `program` + optional `program_other`, and cross-validate that
  `program_other` is filled when `program === "Other"`. Add `college`/`program`
  to `SignupRow`.
- `src/lib/signups.server.ts`: insert the new columns; add them to the
  `fetchAllSignups` select list.
- `src/routes/join.tsx`: two `Select` fields (College, Program), Program disabled
  until a College is chosen and reset when the College changes; conditional
  "Please specify" text input when Program is "Other"; updated email and student
  ID inline validation and messages.
- `src/routes/admin.tsx`: College and Program columns.

## Verification

- Submitting a non-Alfaisal email is blocked with a clear message.
- 6-digit and 9-digit student IDs pass; 7, 8, or 10 digits and letters are rejected.
- Choosing College of Business shows only business programs; switching college
  resets the program.
- A successful submission is visible in `/admin` with the correct College and
  Program, and older rows still show their original major.
