-- Fix: Allow service-level inserts for participant_join_log via trigger
-- Since this table is for logging, we'll create a trigger to auto-log joins

CREATE OR REPLACE FUNCTION public.log_participant_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.participant_join_log (participant_id, meeting_id, joined_at)
  VALUES (NEW.id, NEW.meeting_id, NEW.joined_at);
  RETURN NEW;
END;
$$;

-- Create trigger on participants table to auto-log joins
DROP TRIGGER IF EXISTS on_participant_join ON public.participants;
CREATE TRIGGER on_participant_join
  AFTER INSERT ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_participant_join();