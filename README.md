# ISACA Student Chapter — Alfaisal University

The website for the ISACA Student Chapter at Alfaisal University. Public pages
(home, mission, events, team, join) plus a password-gated admin dashboard for
membership applications.

Live site: [auisaca.com](https://auisaca.com)

## Stack

| Layer     | Choice                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------- |
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, SSR, server functions)                    |
| Styling   | Tailwind CSS v4, shadcn/ui primitives, custom design tokens in `src/styles.css`                   |
| Motion    | [motion](https://motion.dev) for reveals, page transitions, layout animations                     |
| 3D        | three.js via React Three Fiber + drei — procedural ISACA mark in the hero, ambient orbs elsewhere |
| Backend   | Supabase (Postgres + RLS) for sign-ups; transactional email via Lovable                           |
| Hosting   | [Lovable](https://lovable.dev) — pushes to `main` sync to the editor                              |

## Local development

Requires Node 20+.

```sh
npm install
cp .env.example .env   # then fill in the Supabase values
npm run dev            # http://localhost:8080
```

Other scripts:

```sh
npm run build          # production build (.output/)
npm run lint           # eslint
npm run format         # prettier --write .
npx tsc --noEmit       # strict type-check
```

## Environment

`.env` is git-ignored and must never be committed. The required keys are listed
in `.env.example`:

- `SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY` — server side
- `VITE_SUPABASE_*` — the same values, exposed to the client bundle

The publishable (anon) key is safe to ship to browsers; access is governed by
row-level security in `supabase/migrations`.

## Project layout

```
src/
  routes/            file-based routes (TanStack Router)
    index.tsx        homepage — 3D hero, pillars, certification explorer
    mission.tsx      mission & about
    events.tsx       planned sessions and formats
    team.tsx         team switcher; every role links to a prefilled /join
    join.tsx         membership form + interview-slot picker (Supabase)
    admin.tsx        applications dashboard (password gated)
  components/
    fx/              motion primitives: Reveal, TiltCard, Magnetic, Marquee, CTA
    three/           R3F scenes (hero-scene, orb-scene) and SSR-safe wrappers
    ui/              shadcn/ui primitives
  lib/               data (teams, certifications), server functions, Supabase glue
  styles.css         design tokens, utilities (.glass, .card-glow, .aurora, .btn-*)
public/
  brand/             ISACA logo assets
supabase/            config + migrations
```

## 3D and accessibility

- Scenes are lazy-loaded on the client only; three.js never enters the SSR
  bundle or the initial chunk.
- If WebGL is unavailable or `prefers-reduced-motion` is set, a static
  composition renders instead. Render loops pause when a scene scrolls
  off-screen.
- Tilt and magnetic effects disable themselves on touch devices.

## Deploying

The repository is connected to Lovable. Commits pushed to `main` sync to the
Lovable editor and deploy from there. Avoid rewriting published history
(force-push, rebase, amend) — see `AGENTS.md`.
