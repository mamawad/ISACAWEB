# ISACA Student Chapter — Alfaisal University

The website for the ISACA Student Chapter at Alfaisal University. Public pages
(home, mission, events, team, join), a password-gated admin dashboard for
membership applications, and a private project-management workspace at
`/manage` for the chapter's teams.

Live site: [auisaca.com](https://auisaca.com)

## Stack

| Layer     | Choice                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------- |
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, SSR, server functions)                    |
| Styling   | Tailwind CSS v4, shadcn/ui primitives, custom design tokens in `src/styles.css`                   |
| Motion    | [motion](https://motion.dev) for reveals, page transitions, layout animations                     |
| 3D        | three.js via React Three Fiber + drei — procedural ISACA mark in the hero, ambient orbs elsewhere |
| Drag/drop | [dnd-kit](https://dndkit.com) for the Kanban board                                                |
| Backend   | Supabase (Postgres + RLS + Storage); transactional email via Lovable                              |
| Hosting   | [Lovable](https://lovable.dev) — pushes to `main` sync to the editor                              |

## Local development

Requires Node 20+.

```sh
npm install
cp .env.example .env   # then fill in the values
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

`.env` is git-ignored and must never be committed. The keys are listed in
`.env.example`:

| Key                                                               | Purpose                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| `SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY` | Server-side Supabase access (anon key, RLS applies)              |
| `VITE_SUPABASE_*`                                                 | Same values, exposed to the client bundle                        |
| `SUPABASE_SERVICE_ROLE_KEY`                                       | Service role for server functions (Lovable Cloud injects this)   |
| `SESSION_SECRET`                                                  | Encrypts the admin and workspace session cookies                 |
| `MANAGE_ADMIN_PASSWORD`                                           | One-time bootstrap for the workspace `admin` account (see below) |

The publishable (anon) key is safe to ship to browsers; access is governed by
row-level security in `supabase/migrations`. The service role key and session
secret are provided by Lovable Cloud in production — set them locally only if
you want to exercise the admin or workspace flows against the real database.

## The `/manage` workspace

A hidden, login-only project-management area (not linked from the site,
disallowed in `robots.txt`, `noindex`). It is a lightweight Jira for the
chapter:

- **Projects** with a key (e.g. `PR`), colour, lead and members. Each has a
  **board** (drag-and-drop Kanban), a **list** (sortable, filterable, inline
  status), a **timeline** (Gantt with draggable/resizable bars), a **drive**
  (file uploads to Supabase Storage plus pinned external links) and
  **settings** (members, archive, delete).
- **Tasks** with type (epic / story / task / bug), status, priority, assignee,
  reporter, epic parent, labels, dates, estimate, subtasks, attachments,
  comments and a per-task activity log.
- **People & roles.** Administrators (or anyone with `people.manage`) create
  accounts with a username and temporary password, reset passwords, deactivate
  or delete. Roles are named bundles of permissions (`roles.manage`); four
  built-ins are seeded — Administrator, Director, Member, Viewer — and more can
  be added by name. Project access (lead / editor / member / viewer) layers on
  top, per project.
- **View as.** Administrators can open the workspace exactly as another member
  sees it; an amber banner shows while impersonating.
- **Dashboard** and **My work** views, a `Ctrl/⌘ K` command palette, and
  "keep me signed in" (30-day cookie) on the login page.

### First sign-in

There is no admin credential in the repository. Set `MANAGE_ADMIN_PASSWORD` in
the environment, then sign in at `/manage` as `admin` with that value. The
first successful attempt creates the administrator row (salted PBKDF2 hash)
and the variable is not needed afterwards — change the password from the
profile page.

### Security model

- Every `pm_*` table is RLS-enabled with no policies; the anon key sees
  nothing. All reads and writes go through server functions using the service
  role, which check the signed-in user's permissions on every call.
- Passwords are hashed with PBKDF2-SHA256 (120k iterations) via WebCrypto.
- Login is rate-limited per address using the same lockout table as the
  applications admin.
- Sessions are encrypted `httpOnly` cookies (`chapter-manage`).

The schema lives in `supabase/migrations/20260915120000_manage_workspace.sql`
and is applied by Lovable Cloud on sync.

## Project layout

```
src/
  routes/
    index.tsx, mission.tsx, events.tsx, team.tsx, join.tsx   public site
    admin.tsx                     applications dashboard (password gated)
    manage.tsx                    workspace layout + auth guard
    manage/                       login, dashboard, tasks, people, roles, profile
    manage/projects/$key/         board, list, timeline, drive, settings
  components/
    fx/                           motion primitives for the public site
    three/                        R3F scenes and SSR-safe wrappers
    manage/                       workspace UI: shell, board, timeline, task drawer…
    ui/                           shadcn/ui primitives
  lib/
    pm/                           workspace: permissions model, server functions
    …                             site data, sign-up server functions, Supabase glue
  styles.css                      design tokens for both themes
public/brand/                     ISACA logo assets
supabase/                         config + migrations
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
