CREATE TABLE public.chapter_signups (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  student_id text not null,
  major text not null,
  year_of_study text not null,
  phone text,
  reason text,
  created_at timestamptz not null default now()
);

GRANT INSERT ON public.chapter_signups TO anon;
GRANT ALL ON public.chapter_signups TO service_role;

ALTER TABLE public.chapter_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a signup"
  ON public.chapter_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);