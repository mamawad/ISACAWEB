# Add a fourth team: IT & Digital Development

Expand the chapter structure from three teams to four, and refresh the
Academic & Technical Programs member roles.

## New team: IT & Digital Development

Description: Builds and maintains the chapter's digital presence, from the
website to internal tools.

Leadership:

- Director of IT & Digital Development - Leads the chapter's web and digital
  projects, and oversees technical upkeep of chapter platforms.
- Associate Director of IT & Digital Development - Supports the Director on
  delivery, coordinating developers and keeping projects on track.

Members:

- Web Development Member - Builds and maintains the chapter website and web
  tools.
- App Development Member - Works on mobile or internal app projects for the
  chapter.

## Academic & Technical Programs changes

Members become:

- Workshop Facilitator Member (unchanged) - Helps prepare and run hands-on labs
  and technical workshops.
- Research & Innovation Member (new) - Supports research initiatives, technical
  projects, and opportunities that encourage members to explore cybersecurity,
  IT governance, emerging technologies, and innovation.

The existing "Website & IT Member" role moves out of this team; that work is now
covered by the Web Development Member on the new IT & Digital Development team.

Leadership for this team stays as-is (Director and Associate Director of
Academic & Technical Programs).

## Where this shows up

- `/team` page: a fourth team block renders automatically, with the same
  centered leadership pair on top and member grid below. A new icon (code/laptop)
  is mapped for IT & Digital Development.
- Join Us form: "IT & Digital Development" appears in the team dropdown, and its
  four roles appear in the role dropdown once that team is picked.
- Director and Associate Director of IT & Digital Development count as
  leadership roles, so applicants for them are asked to pick an interview slot,
  same as the other teams (the existing rule matches any role containing
  "Director").

## Technical notes

- `src/lib/teams.ts`: append the new team object; edit the Academic members
  array. `TEAM_OPTIONS` and `rolesForTeam` derive from `TEAMS`, so both the team
  page and the form update with no other changes.
- `src/routes/team.tsx`: add one entry to `TEAM_ICONS`.
- No database change. `preferred_team` / `preferred_role` are free-form text, so
  existing rows (including anyone stored as "Website & IT Member") stay intact
  and still display in `/admin`.

## Verification

- `/team` renders four teams with the correct roles and no leftover
  "Website & IT Member".
- On `/join`, picking IT & Digital Development lists its four roles plus
  "Any role in this team"; picking its Director shows the interview slot picker.
