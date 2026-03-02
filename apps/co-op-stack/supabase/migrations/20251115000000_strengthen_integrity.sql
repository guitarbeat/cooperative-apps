-- Strengthen referential integrity, indexes, and RLS for Supabase tables
-- This migration is idempotent and skips operations if they already exist.

begin;

-- Participants -> meetings foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_participants_meeting'
  ) THEN
    ALTER TABLE public.participants
    ADD CONSTRAINT fk_participants_meeting
    FOREIGN KEY (meeting_id)
    REFERENCES public.meetings(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

-- Speaking queue -> participants foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_queue_participant'
  ) THEN
    ALTER TABLE public.speaking_queue
    ADD CONSTRAINT fk_queue_participant
    FOREIGN KEY (participant_id)
    REFERENCES public.participants(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

-- Speaking queue -> meetings foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_queue_meeting'
  ) THEN
    ALTER TABLE public.speaking_queue
    ADD CONSTRAINT fk_queue_meeting
    FOREIGN KEY (meeting_id)
    REFERENCES public.meetings(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

-- Participant join log -> participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_log_participant'
  ) THEN
    ALTER TABLE public.participant_join_log
    ADD CONSTRAINT fk_log_participant
    FOREIGN KEY (participant_id)
    REFERENCES public.participants(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

-- Participant join log -> meetings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_log_meeting'
  ) THEN
    ALTER TABLE public.participant_join_log
    ADD CONSTRAINT fk_log_meeting
    FOREIGN KEY (meeting_id)
    REFERENCES public.meetings(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_code ON public.meetings (meeting_code);
CREATE INDEX IF NOT EXISTS idx_meetings_is_active ON public.meetings (is_active);
CREATE INDEX IF NOT EXISTS idx_participants_meeting_active ON public.participants (meeting_id, is_active);
CREATE INDEX IF NOT EXISTS idx_speaking_queue_meeting_position ON public.speaking_queue (meeting_id, position);

-- Allow logging insertions into participant_join_log while keeping facilitator visibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'participant_join_log'
      AND policyname = 'Participants can create join logs'
  ) THEN
    CREATE POLICY "Participants can create join logs"
    ON public.participant_join_log
    FOR INSERT
    TO public
    WITH CHECK (
      participant_id IS NOT NULL
      AND meeting_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.participants p
        WHERE p.id = participant_join_log.participant_id
      )
    );
  END IF;
END
$$;

commit;
