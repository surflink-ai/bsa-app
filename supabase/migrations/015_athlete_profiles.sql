-- Phase 4: Athlete self-service profiles

-- Extend athletes table
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS sponsor_names text[] DEFAULT '{}';
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS claim_status text DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed','pending','claimed','rejected'));
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_athletes_claimed ON athletes(claimed_by) WHERE claimed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_athletes_claim_status ON athletes(claim_status);

-- Athlete auth: allow athletes to sign up and claim profiles
-- They use regular Supabase auth but get 'athlete' role in profiles
-- No admin access — separate portal at /athlete/dashboard

-- RLS: athletes can read all athlete records, but only edit their own claimed profile
-- RLS policies (drop if exist, then recreate)
DROP POLICY IF EXISTS "Public read athletes" ON athletes;
DROP POLICY IF EXISTS "Athletes update own profile" ON athletes;
DROP POLICY IF EXISTS "Admin full athletes" ON athletes;

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read athletes" ON athletes FOR SELECT USING (true);

CREATE POLICY "Athletes update own profile" ON athletes FOR UPDATE USING (
  claimed_by = auth.uid()
) WITH CHECK (
  claimed_by = auth.uid()
);

CREATE POLICY "Admin full athletes" ON athletes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
);
