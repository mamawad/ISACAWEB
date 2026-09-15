-- Manage workspace (/manage): chapter project management.
-- Users + roles (ACL), projects + membership, tasks, comments, activity log,
-- and a per-project drive backed by Supabase Storage.
--
-- Every table is RLS-enabled with NO policies: anon/authenticated get nothing.
-- All access goes through server functions using the service role, which
-- enforce the ACL in application code.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- roles
create table if not exists public.pm_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  permissions text[] not null default '{}',
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- users
create table if not exists public.pm_users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  display_name text not null,
  email text,
  password_hash text not null,
  role_id uuid references public.pm_roles(id) on delete set null,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  avatar_color text not null default '#7c3aed',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists pm_users_username_lower_idx on public.pm_users (lower(username));

-- ---------------------------------------------------------------- projects
create table if not exists public.pm_projects (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  color text not null default '#7c3aed',
  lead_id uuid references public.pm_users(id) on delete set null,
  task_counter integer not null default 0,
  is_archived boolean not null default false,
  created_by uuid references public.pm_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pm_project_members (
  project_id uuid not null references public.pm_projects(id) on delete cascade,
  user_id uuid not null references public.pm_users(id) on delete cascade,
  access text not null default 'member' check (access in ('lead', 'editor', 'member', 'viewer')),
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index if not exists pm_project_members_user_idx on public.pm_project_members (user_id);

-- ---------------------------------------------------------------- tasks
create table if not exists public.pm_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pm_projects(id) on delete cascade,
  number integer not null,
  type text not null default 'task' check (type in ('epic', 'story', 'task', 'bug')),
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('backlog', 'todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'medium'
    check (priority in ('lowest', 'low', 'medium', 'high', 'highest')),
  assignee_id uuid references public.pm_users(id) on delete set null,
  reporter_id uuid references public.pm_users(id) on delete set null,
  parent_id uuid references public.pm_tasks(id) on delete set null,
  labels text[] not null default '{}',
  start_date date,
  due_date date,
  estimate_hours numeric,
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (project_id, number)
);
create index if not exists pm_tasks_project_status_idx on public.pm_tasks (project_id, status);
create index if not exists pm_tasks_assignee_idx on public.pm_tasks (assignee_id);
create index if not exists pm_tasks_parent_idx on public.pm_tasks (parent_id);

-- ---------------------------------------------------------------- comments
create table if not exists public.pm_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.pm_tasks(id) on delete cascade,
  user_id uuid references public.pm_users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists pm_comments_task_idx on public.pm_comments (task_id);

-- ---------------------------------------------------------------- activity
create table if not exists public.pm_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.pm_projects(id) on delete cascade,
  task_id uuid references public.pm_tasks(id) on delete cascade,
  user_id uuid references public.pm_users(id) on delete set null,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists pm_activity_project_idx on public.pm_activity (project_id, created_at desc);
create index if not exists pm_activity_task_idx on public.pm_activity (task_id, created_at desc);

-- ---------------------------------------------------------------- files / drive
create table if not exists public.pm_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pm_projects(id) on delete cascade,
  task_id uuid references public.pm_tasks(id) on delete set null,
  kind text not null default 'file' check (kind in ('file', 'link')),
  name text not null,
  storage_path text,
  url text,
  size bigint,
  mime text,
  uploaded_by uuid references public.pm_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists pm_files_project_idx on public.pm_files (project_id, created_at desc);

-- ---------------------------------------------------------------- grants + RLS
grant all on public.pm_roles to service_role;
grant all on public.pm_users to service_role;
grant all on public.pm_projects to service_role;
grant all on public.pm_project_members to service_role;
grant all on public.pm_tasks to service_role;
grant all on public.pm_comments to service_role;
grant all on public.pm_activity to service_role;
grant all on public.pm_files to service_role;

alter table public.pm_roles enable row level security;
alter table public.pm_users enable row level security;
alter table public.pm_projects enable row level security;
alter table public.pm_project_members enable row level security;
alter table public.pm_tasks enable row level security;
alter table public.pm_comments enable row level security;
alter table public.pm_activity enable row level security;
alter table public.pm_files enable row level security;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit)
values ('pm-drive', 'pm-drive', false, 52428800)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- seed roles
insert into public.pm_roles (name, description, permissions, is_system) values
  ('Administrator', 'Full access to everything in the workspace.', '{*}', true),
  ('Director',
   'Runs a team: creates projects, manages members and tasks, and can view any member''s workspace.',
   '{projects.view_all,projects.create,projects.manage,tasks.create,tasks.edit_any,tasks.delete,files.upload,files.manage,people.view,people.impersonate}',
   true),
  ('Member',
   'Works inside the projects they belong to.',
   '{tasks.create,tasks.edit_own,files.upload,people.view}',
   true),
  ('Viewer', 'Read-only access to the projects they belong to.', '{people.view}', true)
on conflict (name) do nothing;
