-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create meetings" ON public.meetings;

-- Create a permissive policy allowing anyone to create meetings
CREATE POLICY "Anyone can create meetings"
ON public.meetings
FOR INSERT
WITH CHECK (true);

-- Also add a DELETE policy so facilitators can delete their meetings
CREATE POLICY "Facilitators can delete own meetings"
ON public.meetings
FOR DELETE
USING (facilitator_id = auth.uid() OR facilitator_id IS NULL);