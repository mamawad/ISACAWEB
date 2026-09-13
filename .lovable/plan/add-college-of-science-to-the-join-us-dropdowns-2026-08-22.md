# Add College of Science to the Join Us dropdowns

Alfaisal's College of Science & General Studies runs one undergraduate degree,
the BSc in Life Sciences, which splits into two tracks from third year. Its
other departments (Chemistry, Physics, Mathematics & Computer Science, English,
Humanities) teach courses but are not standalone undergraduate majors, and
Nanoscience & Nanotechnology is a master's program.

## New college options

Add **Science** to the college dropdown, with these programs:

- Life Sciences
- Life Sciences (Biological Sciences and Nanotechnology)
- Life Sciences (Environmental Sciences and Sustainability)
- Other

The University Preparatory Program (UPP) is university-wide and sits under no
college, so it gets its own college option with a single "Undecided" program:

- University Preparatory Program (UPP): Undecided, Other

"Other" keeps the existing free-text box, so a student in any department not
listed can still sign up.

Order in the dropdown: Engineering, Business, Science, University Preparatory
Program (UPP), Law and International Relations, Medicine, Other.

## Technical notes

- `src/lib/signups.schema.ts`: add the `Science` key to the `COLLEGES` map with
  the program list above. `COLLEGE_OPTIONS` and the Zod enum derive from that
  object, so client and server validation update automatically.
- No database migration: `college` and `program` are plain text columns.
- No change to `src/routes/join.tsx` or `src/routes/admin.tsx`; both already
  render whatever is in the map.

## Verification

Open Join Us, pick Science, confirm the program list shows the entries above,
submit a test entry, check it in `/admin`, then delete the test row.
