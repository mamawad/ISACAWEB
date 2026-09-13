CREATE OR REPLACE FUNCTION public.taken_interview_slots()
RETURNS TABLE (interview_slot timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT interview_slot
  FROM public.chapter_signups
  WHERE interview_slot IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.taken_interview_slots() TO anon, authenticated;