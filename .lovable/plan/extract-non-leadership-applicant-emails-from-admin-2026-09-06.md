# Extract non-leadership applicant emails from /admin

## Goal

On the `/admin` page, give you a one-click way to grab the emails of everyone who applied for a **non-leadership** role (i.e. not Director / Associate Director), so you can paste them into a BCC field and email your members.

## What counts as "leadership"

A role is leadership when it matches `/director/i` (the same rule the Join Us form uses to require an interview slot). That covers all six Director/Associate Director titles. Everyone else is non-leadership:

- Member roles (Graphic Design Member, Photography Member, etc.)
- "Any role in this team"
- "Not sure yet"
- Applicants who left role blank

## What I'll build

One new control on the `/admin` dashboard, next to the existing "Download CSV" / "Send missing alerts" / "Lock" buttons:

**"Copy member emails" button**

- Filters the currently-loaded signups to non-leadership rows.
- Joins their emails with commas (the standard BCC separator that Gmail/Outlook both accept).
- Copies the list to the clipboard and shows a toast: `Copied N member emails`.
- If no non-leadership applicants exist yet, the button is disabled.
- Duplicates are de-duplicated so the same person isn't emailed twice (e.g. someone who applied twice). The count in the toast reflects unique emails.

No backend or database changes — this is a pure client-side filter over the signups already loaded after you sign into `/admin`. The emails are already visible in the admin table; this just collects the non-leadership subset into a ready-to-paste string.

## Why not a second CSV

The full CSV export already covers everyone and you can filter it in Excel. The copy-to-clipboard button is faster for the actual task you described ("so I can email them"), since it drops straight into a BCC field.

## Files changed

- `src/routes/admin.tsx` — add the button, a helper that builds the comma-joined unique email string, wire it to the existing toolbar.
