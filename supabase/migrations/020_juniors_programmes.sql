-- Juniors programmes management
CREATE TABLE IF NOT EXISTS junior_programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  age_group text, -- e.g. "Under 10", "Under 14 & Under 16"
  description text,
  schedule text, -- e.g. "Saturdays, 8:00–10:00 AM"
  location text,
  coach_name text,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  category text DEFAULT 'coaching' CHECK (category IN ('coaching','camp','development','elite')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE junior_programmes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view programmes" ON junior_programmes FOR SELECT USING (true);
CREATE POLICY "Admins manage programmes" ON junior_programmes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('general','compete','sponsor','coaching','membership','media','juniors')),
  read boolean DEFAULT false,
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read submissions" ON contact_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);
CREATE POLICY "Anyone can submit" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage submissions" ON contact_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);

-- Seed default programmes
INSERT INTO junior_programmes (title, age_group, description, schedule, location, category, sort_order) VALUES
  ('Grom Development', 'Under 10', 'Introduction to surfing fundamentals, ocean safety, and board handling. Designed to build confidence and a love for the ocean in young surfers.', 'Saturdays, 8:00–10:00 AM', 'Drill Hall Beach', 'development', 1),
  ('Junior Competitive', 'Under 14 & Under 16', 'Structured coaching for competitive surfers. Focus on contest strategy, manoeuvre progression, heat tactics, and physical conditioning.', 'Tuesdays & Thursdays, 3:30–5:30 PM', 'Soup Bowl / Drill Hall', 'coaching', 2),
  ('Elite Junior Squad', 'Under 18', 'Advanced programme for BSA-ranked juniors targeting national team selection and international competition. Includes video analysis, strength & conditioning, and mental performance coaching.', 'Mon, Wed, Fri, 4:00–6:00 PM', 'Soup Bowl', 'elite', 3),
  ('Summer Surf Camp', 'All Ages', 'Annual week-long surf camp during summer holidays. Open to all abilities — beginners welcome. Certified instructors, equipment provided, and heaps of fun.', 'July / August (dates TBA)', 'Various Locations', 'camp', 4)
ON CONFLICT DO NOTHING;
