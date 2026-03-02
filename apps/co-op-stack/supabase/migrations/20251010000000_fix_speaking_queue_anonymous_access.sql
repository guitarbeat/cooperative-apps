-- Fix Speaking Queue Anonymous Access
-- This migration fixes the RLS policies to allow anonymous participants to join/leave the speaking queue

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Participants can join queue" ON public.speaking_queue;
DROP POLICY IF EXISTS "Users can leave their own queue" ON public.speaking_queue;
DROP POLICY IF EXISTS "Facilitators can manage queue" ON public.speaking_queue;
DROP POLICY IF EXISTS "Anyone can view speaking queue" ON public.speaking_queue;
DROP POLICY IF EXISTS "Anyone can join/leave queue" ON public.speaking_queue;

-- Allow anyone to view the speaking queue
CREATE POLICY "Anyone can view speaking queue"
ON public.speaking_queue
FOR SELECT
USING (true);

-- Allow participants to join and leave queue anonymously
CREATE POLICY "Anyone can join/leave queue"
ON public.speaking_queue
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.participants
    WHERE participants.id = speaking_queue.participant_id
    AND participants.is_active = true
  )
);

-- Facilitators can manage queue (authenticated users only)
CREATE POLICY "Facilitators can manage queue"
ON public.speaking_queue
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = speaking_queue.meeting_id
    AND meetings.facilitator_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = speaking_queue.meeting_id
    AND meetings.facilitator_id = (select auth.uid())
  )
);
