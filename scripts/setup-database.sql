-- Create the scans table in Supabase
CREATE TABLE IF NOT EXISTS public.scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode_value text NOT NULL,
    scanned_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid REFERENCES auth.users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON public.scans (scanned_at);
CREATE INDEX IF NOT EXISTS idx_scans_barcode_value ON public.scans (barcode_value);

-- Enable Row Level Security (optional, for when you add authentication)
-- ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for demo purposes)
-- For production, you should implement proper authentication
CREATE POLICY "Allow anonymous inserts" ON public.scans
    FOR INSERT WITH CHECK (true);

-- Create policy to allow anonymous selects (for demo purposes)
CREATE POLICY "Allow anonymous selects" ON public.scans
    FOR SELECT USING (true);
