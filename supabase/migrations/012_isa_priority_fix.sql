-- 012: ISA-Compliant Priority System Fix
-- Priority establishment tracking, suspension states, interference penalty changes

-- Track whether priority has been fully established in a heat
ALTER TABLE comp_heats ADD COLUMN IF NOT EXISTS priority_established boolean DEFAULT false;
-- Track riders during establishment phase (ordered list of heat_athlete_ids who have ridden)
ALTER TABLE comp_heats ADD COLUMN IF NOT EXISTS priority_riders jsonb DEFAULT '[]'::jsonb;

-- Per-athlete priority status: active, suspended, none, or establishing
ALTER TABLE comp_heat_athletes ADD COLUMN IF NOT EXISTS priority_status text DEFAULT 'none' CHECK (priority_status IN ('active', 'suspended', 'none'));
-- Priority position (1 = highest). Null = no priority assigned yet
ALTER TABLE comp_heat_athletes ADD COLUMN IF NOT EXISTS priority_position integer;
-- Track if athlete was DQ'd (double interference)
ALTER TABLE comp_heat_athletes ADD COLUMN IF NOT EXISTS is_disqualified boolean DEFAULT false;
-- Track which wave has the interference penalty applied (second-best wave)
ALTER TABLE comp_heat_athletes ADD COLUMN IF NOT EXISTS penalty_applied_to_wave integer;

-- Interference: track that penalty applies to second-best wave, not specific wave
ALTER TABLE comp_interference ADD COLUMN IF NOT EXISTS penalty_applied_to_wave integer;
ALTER TABLE comp_interference ADD COLUMN IF NOT EXISTS is_blocking boolean DEFAULT false;

-- Realtime already enabled for comp_heat_athletes
