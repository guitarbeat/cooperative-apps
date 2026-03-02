-- Fix Critical Security Issues: RLS Policies

-- ============================================
-- 1. FIX SPEAKING_QUEUE POLICIES
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can join/leave queue" ON public.speaking_queue;
DROP POLICY IF EXISTS "Anyone can view speaking queue" ON public.speaking_queue;

-- Allow public to view queue (read-only)
CREATE POLICY "Public can view speaking queue"
ON public.speaking_queue
FOR SELECT
USING (true);

-- Only authenticated participants can add themselves to queue
CREATE POLICY "Participants can join queue"
ON public.speaking_queue
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.participants
    WHERE participants.id = speaking_queue.participant_id
    AND participants.user_id = auth.uid()
  )
);

-- Users can only remove their own queue entries
CREATE POLICY "Users can leave their own queue"
ON public.speaking_queue
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.participants
    WHERE participants.id = speaking_queue.participant_id
    AND participants.user_id = auth.uid()
  )
);

-- Facilitators can manage entire queue for their meetings
CREATE POLICY "Facilitators can manage queue"
ON public.speaking_queue
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = speaking_queue.meeting_id
    AND meetings.facilitator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = speaking_queue.meeting_id
    AND meetings.facilitator_id = auth.uid()
  )
);

-- ============================================
-- 2. FIX MEETINGS POLICIES
-- ============================================

-- Drop old policy with NULL bypass
DROP POLICY IF EXISTS "Facilitators can update their meetings" ON public.meetings;

-- Only facilitators can update their own meetings (no NULL bypass)
CREATE POLICY "Facilitators can update own meetings"
ON public.meetings
FOR UPDATE
TO authenticated
USING (facilitator_id = auth.uid())
WITH CHECK (facilitator_id = auth.uid());

-- ============================================
-- 3. FIX PARTICIPANTS POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can join as participant" ON public.participants;
DROP POLICY IF EXISTS "Participants can update their own record" ON public.participants;

-- Authenticated users can join meetings
CREATE POLICY "Authenticated users can join"
ON public.participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can only update their own participant record
CREATE POLICY "Users can update own record"
ON public.participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Facilitators can update participants in their meetings
CREATE POLICY "Facilitators can update meeting participants"
ON public.participants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = participants.meeting_id
    AND meetings.facilitator_id = auth.uid()
  )
);

-- ============================================
-- 4. FIX DATABASE FUNCTION SECURITY
-- ============================================

-- Fix generate_meeting_code function
CREATE OR REPLACE FUNCTION public.generate_meeting_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
    code_exists BOOLEAN := true;
BEGIN
    WHILE code_exists LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        SELECT EXISTS(SELECT 1 FROM public.meetings WHERE meeting_code = result) INTO code_exists;
    END LOOP;
    
    RETURN result;
END;
$function$;

-- Fix update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;