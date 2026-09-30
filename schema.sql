-- =======================================================
-- Payir - Enhanced Crop Growth Monitoring System
-- Supabase PostgreSQL Schema & Realtime Setup
-- =======================================================

-- 1. Fields Table
CREATE TABLE IF NOT EXISTS public.fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  location text NOT NULL,
  crop_type text NOT NULL,
  latitude float DEFAULT 10.7870,
  longitude float DEFAULT 79.1378,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Sensor Data Telemetry Table
CREATE TABLE IF NOT EXISTS public.sensor_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_no text NOT NULL,
  moisture int NOT NULL,
  temperature float NOT NULL,
  humidity float NOT NULL,
  npk int NOT NULL,
  growth_height float DEFAULT 32.5,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Disease Logs Table
CREATE TABLE IF NOT EXISTS public.disease_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  disease_name text NOT NULL,
  confidence float NOT NULL,
  suggestion text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Actuators Motor Control Table
CREATE TABLE IF NOT EXISTS public.actuators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_no text NOT NULL UNIQUE,
  motor_status boolean DEFAULT false,
  last_on timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS) & Public Access Policies
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuators ENABLE ROW LEVEL SECURITY;

-- Create policies allowing public read & write (adjust according to production auth requirements)
CREATE POLICY "Allow public read access to fields" ON public.fields FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to fields" ON public.fields FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to sensor_data" ON public.sensor_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to sensor_data" ON public.sensor_data FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to disease_logs" ON public.disease_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to disease_logs" ON public.disease_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to actuators" ON public.actuators FOR SELECT USING (true);
CREATE POLICY "Allow public write access to actuators" ON public.actuators FOR ALL USING (true);

-- Enable Supabase Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.actuators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disease_logs;

-- Storage Bucket Setup for Leaf Images
-- Run this in Supabase Storage SQL or create a bucket named 'leaf-images' via Supabase UI with public read access.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('leaf-images', 'leaf-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access Leaf Images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'leaf-images');

CREATE POLICY "Public Upload Access Leaf Images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'leaf-images');

-- Seed Data (Optional initial test records)
INSERT INTO public.fields (field_name, location, crop_type, latitude, longitude) VALUES
('Field 1 - Paddy (நெல்)', 'Thanjavur Delta Region', 'Paddy / Rice (Samba)', 10.7870, 79.1378),
('Field 2 - Sugarcane (கரும்பு)', 'Madurai Agri Zone', 'Sugarcane (Co 0238)', 9.9252, 78.1198),
('Field 3 - Maize & Cotton (சோளம்)', 'Coimbatore Plains', 'Maize / Hybrid Cotton', 11.0168, 76.9558)
ON CONFLICT DO NOTHING;

INSERT INTO public.actuators (field_no, motor_status) VALUES
('Field 1 - Paddy (நெல்)', true),
('Field 2 - Sugarcane (கரும்பு)', false),
('Field 3 - Maize & Cotton (சோளம்)', false)
ON CONFLICT DO NOTHING;
