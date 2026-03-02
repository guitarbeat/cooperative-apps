-- Update RLS policy to require authentication for meeting creation
DROP POLICY IF EXISTS "Anyone can create meetings" ON public.meetings;

CREATE POLICY "Authenticated users can create meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (facilitator_id = auth.uid());