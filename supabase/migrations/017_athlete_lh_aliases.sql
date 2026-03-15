-- Add LiveHeats ID aliases for athletes with duplicate IDs across seasons
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS liveheats_aliases text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_athletes_lh_aliases ON athletes USING GIN (liveheats_aliases);
