# Flexible filter menu on the admin page

## Goal

On `/admin`, add a filter panel so you can narrow the sign-ups to exactly the group you care about (for example "all Directors and Associate Directors", "everyone in IT & Digital Development", "all Public Relations members"), then copy their emails or download a CSV of just that group.

## The filter panel

A collapsible "Filter" panel above the table with checkbox groups. Nothing selected in a group means "all".

- **Team** (multi-select): Public Relations, Academic & Technical Programs, IT & Digital Development, Partnerships & Operations, Not sure yet, No team given.
- **Role type** (multi-select): Director, Associate Director, Member, Any role in this team, Not sure yet, No role given.
- **Specific role** (multi-select): every role title from all four teams, grouped under its team heading. Narrows further inside the chosen teams.
- **Search box**: matches name, email, or student ID.
- **Other toggles**: Year of study, College, and "Emailed / Not emailed yet".
- A "Clear all" link, plus a line showing `Showing 12 of 48 sign-ups`.

Selections apply live to the table below, so what you see is exactly what you act on.

## What the buttons do

The three existing actions become filter-aware:

- **Copy emails** copies the unique emails of the currently filtered rows (label shows the count). This replaces the current fixed "Copy member emails" button, since "non-leadership" now becomes just one of many filter combinations you can pick.
- **Download CSV** exports the filtered rows only.
- **Send missing alerts** stays as-is (it is about email delivery, not selection).

## Notes

- Purely a client-side filter over the sign-ups already loaded after sign-in. No database or backend changes.
- Role type is derived from the stored role title: contains "Associate Director" then Associate Director, else contains "Director" then Director, else the literal special options, else Member.
- Team/role lists come from `src/lib/teams.ts`, so future teams or roles appear in the menu automatically.

## Files changed

- `src/routes/admin.tsx` — filter state, filter panel UI, filtered-row derivation, wire copy/CSV to the filtered set.
- New `src/components/admin/signup-filters.tsx` — the filter panel component and the filter/predicate helpers, to keep `admin.tsx` readable.
