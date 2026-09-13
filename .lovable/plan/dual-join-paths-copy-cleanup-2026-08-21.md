# Dual join paths + copy cleanup

Two changes: give students a clear choice between joining the Alfaisal chapter and joining ISACA Riyadh Chapter, and strip the "AI-generated" tells from the writing across the whole site.

## 1. Two join buttons, side by side

Anywhere the site currently shows a single "Join Us" call to action, show two:

- **Join the Alfaisal chapter** (primary, teal) goes to the in-site `/join` form.
- **Join the Riyadh chapter** (secondary/outline) opens `https://engage.isaca.org/riyadhchapter/home` in a new tab.

Placement:

- Home hero: both buttons in the hero, "Learn our mission" drops to a plain text link below so the hero does not end up with three heavy buttons.
- Home bottom CTA band: both buttons.
- Header: keeps the single "Join Us" button pointing at `/join` (space is tight, and the nav should have one primary action).
- Join Us page: a short line under the form heading noting that joining Riyadh Chapter is separate and optional, with a link.

Wording on the Join Us page will make clear that the two are not exclusive: joining the Alfaisal chapter is how you get into the student community here; ISACA Riyadh Chapter is the wider professional body in the city, and you can do both.

## 2. Make the writing sound human

Pass over every page of copy (Home, Mission, Events, Team, Join Us, Admin, header, footer) and:

- Remove every em dash. Replace with a period, a comma, or a rewritten sentence, whichever reads best. No en dashes or " - " as a sneaky substitute.
- Cut the stock AI cadence: tricolon lists ("the people, knowledge, and certifications"), "from classroom to career" style flourishes, "shaped by what members want to learn", "we bridge the gap".
- Shorter, plainer sentences. Concrete over aspirational. Admitting what does not exist yet rather than dressing it up.
- Keep the mission statement itself intact in substance, but rewrite its dashes and soften the marketing tone slightly. It stays recognisably the statement you drafted.
- Logo alt text and the footer copyright line lose their em dashes too.

Nothing about the layout, colours, or components changes in this pass. Same design, better voice.

## 3. "What you get as a member" block on the Join page

Right now the Join Us form asks for seven fields with no stated benefit. Add a short block above the form listing concrete member benefits:

- CV building and professional development
- Exposure to COBIT and other ISACA certifications
- Discounts on training courses and conferences

Keep it honest and brief. The user will send more specifics (exact certs, discount amounts, partners) in a later prompt. Build the block so extra bullet points can be dropped in without a redesign, and use placeholder-light wording that reads fine today. Remind the user at the end of the turn to send those details.

## 4. Improvements worth doing next (not in this plan)

Listed so you can pick, not being built now:

- Real event dates for 3D Design and PCB Design as soon as they are locked, so Events stops reading as entirely hypothetical.
- Officer names on Team. A grid of six "Coming soon" cards currently undercuts credibility more than an honest single card would.
- Send the material about what the chapter is actually doing. Specifics such as session topics, partner speakers, and turnout are the single biggest fix for a site sounding generated, more than any wording change.

## Technical notes

External link uses a plain `<a>` with `target="_blank"` and `rel="noopener noreferrer"`, not the router `Link`. Files touched: `src/routes/index.tsx`, `mission.tsx`, `events.tsx`, `team.tsx`, `join.tsx`, `admin.tsx`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`. No backend, schema, or dependency changes.
