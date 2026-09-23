CREATE TABLE public.pm_interview_feedback (
  signup_id uuid PRIMARY KEY REFERENCES public.chapter_signups(id) ON DELETE CASCADE,
  rating integer,
  decision text NOT NULL DEFAULT 'pending',
  notes text NOT NULL DEFAULT '',
  author_id uuid REFERENCES public.pm_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.pm_interview_feedback TO service_role;

ALTER TABLE public.pm_interview_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to pm_interview_feedback"
  ON public.pm_interview_feedback
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);