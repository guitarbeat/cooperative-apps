-- Add CHECK constraint to enforce meeting code format at database level
-- This provides defense-in-depth alongside client-side validation

ALTER TABLE public.meetings
ADD CONSTRAINT meeting_code_format
CHECK (meeting_code ~ '^[A-Z0-9]{6}$');