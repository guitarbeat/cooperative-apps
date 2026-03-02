-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_code VARCHAR(6) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  facilitator_name TEXT NOT NULL,
  facilitator_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  user_id UUID,
  is_facilitator BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create speaking queue table
CREATE TABLE public.speaking_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  queue_type TEXT NOT NULL DEFAULT 'speak' CHECK (queue_type IN ('speak', 'direct-response', 'point-of-info', 'clarification')),
  position INTEGER NOT NULL,
  joined_queue_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_speaking BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for meetings (publicly readable, anyone can create)
CREATE POLICY "Anyone can view meetings" 
ON public.meetings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create meetings" 
ON public.meetings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Facilitators can update their meetings" 
ON public.meetings 
FOR UPDATE 
USING (facilitator_id = auth.uid() OR facilitator_id IS NULL);

-- Create policies for participants
CREATE POLICY "Anyone can view participants" 
ON public.participants 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can join as participant" 
ON public.participants 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Participants can update their own record" 
ON public.participants 
FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

-- Create policies for speaking queue
CREATE POLICY "Anyone can view speaking queue" 
ON public.speaking_queue 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can join/leave queue" 
ON public.speaking_queue 
FOR ALL 
USING (true);

-- Create function to generate unique meeting codes
CREATE OR REPLACE FUNCTION generate_meeting_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_meetings_code ON public.meetings(meeting_code);
CREATE INDEX idx_participants_meeting ON public.participants(meeting_id);
CREATE INDEX idx_queue_meeting ON public.speaking_queue(meeting_id);
CREATE INDEX idx_queue_position ON public.speaking_queue(meeting_id, position);