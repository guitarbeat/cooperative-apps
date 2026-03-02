-- Update RLS policy to allow authenticated users (including anonymous) to create meetings
DROP POLICY IF EXISTS "Authenticated users can create meetings" ON public.meetings;

CREATE POLICY "Authenticated users can create meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow any authenticated user (including anonymous) to create meetings
  auth.uid() IS NOT NULL
  AND facilitator_id = auth.uid()
);