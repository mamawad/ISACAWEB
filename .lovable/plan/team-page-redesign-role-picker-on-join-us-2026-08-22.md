# Team page redesign + role picker on Join Us

## 1. Team page: drop the "Open" badges, split directors from members

- Remove the green "Open" pill from every card. The hero line already says all
  roles are open, so the badges just add noise.
- Each team block becomes two tiers:
  - **Leadership row on top**: the Director and Associate Director, centered as
    two wider cards side by side (stacked on mobile). Slightly larger heading,
    accent-tinted top border, and the team icon so they read as the anchor of
    the team.
  - **Members below**: a left-to-right grid (2 columns on tablet, 3 on desktop)
    of the remaining member roles in compact cards, under a small "Members"
    label with a divider line.
- Keep the existing hero, navy/teal palette, `font-display` headings, `bg-card`
  cards, and the bottom "Interested in joining a team?" CTA unchanged.

## 2. Join Us: pick a team, then a role

Two new dropdowns on the form, placed after Year of study:

- **Preferred team** (optional): Public Relations, Academic & Technical
  Programs, Partnerships & Operations, or "Not sure yet".
- **Preferred role** (optional): disabled until a team is chosen, then lists
  only that team's roles, plus "Any role in this team". Changing the team
  resets the role, same behaviour as College and Program.

Under those fields: a short line, "Not sure what these roles involve? See the
team page", linking to `/team` (opens in the same tab).

The two answers are saved with the sign-up and shown as columns in `/admin`.

## 3. Technical notes

- New shared module `src/lib/teams.ts` exporting the three teams with
  `{ title, description, icon, directors[], members[] }`. Both `src/routes/team.tsx`
  and the Join Us form read from it, so the lists can never drift apart.
  `team.tsx` drops its local `TEAMS` array.
- Migration: add nullable `preferred_team text` and `preferred_role text` to
  `public.chapter_signups`. No RLS/grant change (columns on an existing table).
- `src/lib/signups.schema.ts`: add both fields as optional strings (max 120).
  Left as free-form text rather than an enum so renaming a role later never
  rejects a submission.
- `src/lib/signups.server.ts`: write and read the two new columns.
- `src/routes/join.tsx`: two linked `Select`s reusing the existing `Field`
  wrapper and the `truncate`/`min-w-0` trigger fix.
- `src/routes/admin.tsx`: add "Team" and "Role" columns.

## Verification

- `/team` renders three teams with centered director pairs on top, member grid
  below, no "Open" badges, checked at desktop and mobile widths.
- On `/join`, choosing a team filters the role list; submitting a test entry
  stores both values and they appear in `/admin`. Test row deleted afterwards.
