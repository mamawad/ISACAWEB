# Fix overlapping College/Program fields, shorten the labels, add later years

## 1. Stop the text overlapping

Right now College and Program sit side by side in a two-column row, so a long
value like "College of Engineering and Advanced Computing" spills over the
Program dropdown next to it.

Fixes, applied together:

- Put College and Program on their own full-width rows (stacked), like the
  other long fields on the form. No side-by-side squeeze.
- Make the dropdown trigger clip its own text (truncate with an ellipsis if it
  ever gets long) so nothing can ever bleed into a neighbouring field.

## 2. Shorten the college and program names

Colleges become:

- Engineering
- Business
- Law and International Relations (kept as is; it is the actual college and
  there is no shorter accurate name, but it now sits on its own full-width row
  so it fits)
- Medicine
- Other

Programs drop the redundant "Engineering" suffix since the college already says
it:

Engineering: Architecture, Architectural, Artificial Intelligence,
Biomedical, Cybersecurity, Data Science, Electrical, Industrial, Mechanical,
Software, Other

Business: Finance, Management, Human Resources, Marketing, Business Analytics,
Accounting, Project Management, Entrepreneurship, Other

Law and International Relations: Law (LLB), International Relations, Other

Medicine: Medicine and Surgery (MBBS), Other

Other: Other (free-text box appears)

## 3. Year of study: add fifth and sixth year

Medicine runs longer than four years, so the list becomes:
Foundation / Pre-professional, First year, Second year, Third year,
Fourth year, Fifth year, Sixth year, Intern / Graduate, Other.

## What about existing sign-ups?

Rows already saved keep whatever text they were saved with. The admin table
just shows the stored value, so old entries stay readable next to new
shortened ones. No database change is needed: college and program are plain
text columns.

## Technical notes

- `src/lib/signups.schema.ts`: rename the `COLLEGES` keys, shorten the program
  arrays, and extend `YEAR_OPTIONS`. Both are Zod enums, so validation follows
  automatically on client and server.
- `src/routes/join.tsx`: move College and Program out of the two-column grid
  into their own rows; add `truncate`/`min-w-0` on the select trigger value.
- No migration, no server-function changes.

## Verification

- Pick Engineering, then check the Program dropdown is fully visible and no
  text overlaps at desktop and mobile widths.
- Pick Medicine + Sixth year and submit a test entry, confirm it saves and
  shows correctly in /admin, then delete the test row.
