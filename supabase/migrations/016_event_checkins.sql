-- Phase 5: Event check-in system

CREATE TABLE IF NOT EXISTS event_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE,
  athlete_name text NOT NULL,
  division text,
  qr_code text UNIQUE NOT NULL,
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_checkins_event ON event_checkins(event_id);
CREATE INDEX idx_checkins_qr ON event_checkins(qr_code);

ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read checkins" ON event_checkins FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);
CREATE POLICY "Admin write checkins" ON event_checkins FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);
