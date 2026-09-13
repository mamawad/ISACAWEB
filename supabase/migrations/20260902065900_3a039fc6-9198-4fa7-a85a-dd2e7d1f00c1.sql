CREATE INDEX IF NOT EXISTS idx_chapter_signups_created_at ON public.chapter_signups (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapter_signups_interview_slot ON public.chapter_signups (interview_slot) WHERE interview_slot IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chapter_signups_email ON public.chapter_signups (email);