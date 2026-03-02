-- Enable REPLICA IDENTITY FULL for realtime updates on meetings table
ALTER TABLE public.meetings REPLICA IDENTITY FULL;

-- Add meetings table to supabase_realtime publication for real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;

-- Also enable realtime for participants table (useful for participant count updates)
ALTER TABLE public.participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;