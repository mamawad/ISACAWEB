ALTER TABLE public.chapter_signups
  ADD COLUMN IF NOT EXISTS interview_slot timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS chapter_signups_interview_slot_unique
  ON public.chapter_signups (interview_slot);