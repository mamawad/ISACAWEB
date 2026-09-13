# Rebuild the /team page around three teams

Replace the flat officer grid (President, Vice President, Secretary, Events Lead,
Outreach Lead, Treasurer) with three structured teams. No "President" or
"Vice President" appears anywhere on the page. All roles listed are open.

## What changes

### `src/routes/team.tsx`

Keep the existing visual style: the `hero-surface` header, the `font-display`
headings, `bg-card` cards, `text-accent`, `border`, and the bottom "Interested in
an officer role?" CTA linking to `/join`. Only the body content changes.

Structure:

1. **Hero** (unchanged layout, copy lightly updated)
   - Eyebrow: "Team"
   - H1: "The teams behind the chapter"
   - Sub: one line noting that all roles listed are open and the chapter is
     recruiting its founding team.

2. **Three team sections**, each rendered as a block with:
   - A team title (e.g. "Public Relations") as a `font-display` heading.
   - A one-line description under it (`text-muted-foreground`).
   - A responsive grid (`sm:grid-cols-2 lg:grid-cols-3`) of role cards.
   - Each role card: role title (bold), member-type suffix ("Member" vs
     "Director/Associate Director"), and a short responsibility line. Use the
     existing `OfficerCard` look but adapted: a small accent badge or icon for
     the team, role name as the heading, responsibility as the body text.

   Teams and roles (verbatim from the request):

   **Public Relations** — Shapes how the chapter looks and sounds to the outside world.
   - Director of Public Relations — Leads the chapter's social media presence, event promotion, and overall branding strategy.
   - Associate Director of Public Relations — Supports the Director on content production, covering design, photography, and video for events and posts.
   - Graphic Design Member — Designs flyers, social posts, and presentation decks for chapter events.
   - Photography Member — Captures photos at chapter events and meetings for socials and recaps.
   - Video Editing Member — Edits event footage and short-form video for the chapter's social channels.

   **Academic & Technical Programs** — Runs the workshops, labs, and technical sessions members actually show up for.
   - Director of Academic & Technical Programs — Plans and runs workshops and hands-on technical training sessions.
   - Associate Director of Academic & Technical Programs — Leads competition prep for CTFs and hackathons, and supports research initiatives.
   - Workshop Facilitator Member — Helps prepare and run hands-on labs and technical workshops.
   - Website & IT Member — Builds and maintains the chapter website and handles technical upkeep.

   **Partnerships & Operations** — Keeps events resourced, hosted, and organized.
   - Director of Partnerships & Operations — Builds relationships with companies and organizations for sponsorships and partnerships, including venues, prizes, and guest speakers.
   - Associate Director of Partnerships & Operations — Manages event logistics, membership records, and the chapter's day-to-day operations.
   - Sponsorship Outreach Member — Researches and reaches out to potential sponsors and partner organizations.
   - Event Logistics Member — Helps plan and run events on the day, from venue setup to registration.
   - Membership & Records Member — Keeps the member roster, attendance, and chapter communications up to date.

   Each card carries an "Open" status badge (consistent with the existing
   "Details coming soon" badge pattern used on the Events page) so it's clear
   every role is open.

3. **Bottom CTA** (unchanged) — keep the "Interested in an officer role? Reach out"
   block linking to `/join`.

### Data model

Define a `TEAMS` array of `{ title, description, roles: { title, responsibility }[] }`
inside `team.tsx`. Render it with a small `RoleCard` subcomponent. Drop the old
`OFFICERS` array and `OfficerCard` (or repurpose it).

## Out of scope

- No other pages change.
- No backend/database change.
- Head/SEO meta stays as-is (it already describes the officer team generically;
  the description can be lightly tweaked to "the teams behind the chapter" but
  the title remains valid).

## Verification

- `/team` returns 200 and renders the three teams with all listed roles.
- No occurrence of "President" or "Vice President" anywhere on the page.
- Desktop + mobile screenshots confirm the card grids reflow cleanly and the
  existing navy/teal visual style is preserved.
