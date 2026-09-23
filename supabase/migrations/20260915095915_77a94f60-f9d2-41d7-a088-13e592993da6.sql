alter table public.chapter_signups add column if not exists invite_sent_at timestamp with time zone;

create table if not exists public.chapter_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone not null default now()
);

grant all on public.chapter_settings to service_role;
revoke all on public.chapter_settings from anon, authenticated;
alter table public.chapter_settings enable row level security;

create policy "No public access to settings" on public.chapter_settings for all using (false) with check (false);