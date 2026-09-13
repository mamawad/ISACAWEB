# Build the content pages (Mission, Events, Team) per the spec

The shell, Home page, and logo are done. But Mission, Events, and Team are still
generic placeholders, which does not follow the workspace knowledge — that
knowledge specifies concrete content for each. This plan fills those three
pages with their real content. The Join Us form + Supabase backend + admin page
is a separate follow-up (approved, Cloud will be enabled first as a setup step).

## What changes

### 1. Mission / About (`src/routes/mission.tsx`)

Replace the placeholder with real content:

- **Mission statement** — use the draft from the knowledge verbatim:
  > The ISACA Student Chapter at Alfaisal University connects students
  > interested in IT governance, risk management, cybersecurity, and audit
  > with the knowledge, community, and opportunities to grow into
  > industry-ready professionals. We bridge the gap between the classroom and
  > the certifications, tools, and networks that define careers in information
  > security and assurance.
- **"What is ISACA?"** — 1-2 sentences for students who've never heard of it
  (global professional body behind CISA/CISM; the chapter brings that to
  Alfaisal).
- **"What we're building"** — honest list of what the chapter offers/plans:
  community, exposure to certifications, hands-on events, networking. Framed
  as in-progress, not all live yet.
- Layout: hero header (reuse `hero-surface`) + a content section with the
  mission statement as a pull quote, then two columns (What is ISACA / What
  we're building). Keep the existing `head()` SEO meta.

### 2. Events (`src/routes/events.tsx`)

Replace the placeholder with a card layout so real events can drop in later:

- Header: "What we're planning" (not a firm calendar).
- **Teaser cards** (grid, `bg-card`):
  - 3D Design — workshop/session, "Details coming soon"
  - PCB Design — workshop/session, "Details coming soon"
- Each card: icon, title, short description, a "Details coming soon" badge.
- Note under the grid: "More events will be announced as we launch."

### 3. Team (`src/routes/team.tsx`)

Replace the placeholder with an officer grid:

- Header: "The people building the chapter".
- **President card** — a real officer card with "President" role. Name left as
  a clear placeholder the user can edit (e.g. "Chapter President" / "Your name
  here"), no fake name invented.
- **Coming soon** placeholder cards for the remaining officer slots
  (Vice President, Secretary, etc.) marked "Coming soon".
- CTA line: "Interested in an officer role? Reach out" linking to /join.

### 4. Shared styling

Reuse existing tokens (`hero-surface`, `bg-card`, `text-accent`, `border`).
No new dependencies. Cards consistent with the Home page pillar cards.

## Out of scope (next phase, separately)

- Join Us form + Supabase `chapter_signups` table, on-screen confirmation
- `/admin` page (password login via Cloud) listing signups
- Email alert to the backend-only notification address on each signup
- Enabling Lovable Cloud — will be done as the first step of that next phase,
  since you approved it; not needed for these static pages.

## Verification

- All three routes return 200 and render their new content.
- Screenshot desktop + mobile of each page to confirm the layout matches the
  professional navy/teal system and the logo strip remains intact.
