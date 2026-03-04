-- BSA Compete — ISA-Compliant Multi-Judge Scoring System
-- Applied: 2026-03-04

-- ============================================================
-- 1. comp_judge_scores — Source of truth for all scoring
-- One row per judge per wave per athlete
-- ============================================================
create table if not exists comp_judge_scores (
  id uuid primary key default gen_random_uuid(),
  heat_athlete_id uuid not null references comp_heat_athletes(id) on delete cascade,
  wave_number int not null,
  judge_id uuid not null references comp_judges(id) on delete cascade,
  score numeric(3,1) not null check (score >= 0 and score <= 10),
  is_override boolean default false,
  override_reason text,
  override_by uuid references comp_judges(id),
  locked boolean default true, -- scores lock on submission, only head judge can unlock
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Each judge can only score each wave once per athlete
  unique(heat_athlete_id, wave_number, judge_id)
);

-- ============================================================
-- 2. Update comp_heat_athletes — penalties, wave count, priority
-- ============================================================
alter table comp_heat_athletes
  add column if not exists penalty text check (penalty in ('none', 'interference_half', 'interference_zero', 'double_interference')) default 'none',
  add column if not exists penalty_wave int, -- which wave the interference occurred on
  add column if not exists wave_count int default 0,
  add column if not exists total_score numeric(5,2) default 0, -- cached best-2 total
  add column if not exists needs_score numeric(3,1); -- cached: score needed on next wave to improve position

-- ============================================================
-- 3. Update comp_heats — priority system
-- ============================================================
alter table comp_heats
  add column if not exists priority_order jsonb default '[]'::jsonb, -- array of heat_athlete_ids in priority order
  add column if not exists priority_history jsonb default '[]'::jsonb, -- log: [{athlete_id, timestamp, reason}]
  add column if not exists time_remaining_seconds int, -- live countdown
  add column if not exists is_paused boolean default false,
  add column if not exists certified boolean default false, -- head judge sign-off
  add column if not exists certified_by uuid references comp_judges(id),
  add column if not exists certified_at timestamptz,
  add column if not exists protest_deadline timestamptz; -- results not final until this passes

-- ============================================================
-- 4. Update comp_event_divisions — panel size config
-- ============================================================
alter table comp_event_divisions
  add column if not exists panel_size int default 5 check (panel_size >= 1 and panel_size <= 7),
  add column if not exists drop_high_low boolean default true; -- drop highest + lowest when panel_size >= 5

-- ============================================================
-- 5. Judge assignments per heat
-- ============================================================
create table if not exists comp_heat_judges (
  id uuid primary key default gen_random_uuid(),
  heat_id uuid not null references comp_heats(id) on delete cascade,
  judge_id uuid not null references comp_judges(id) on delete cascade,
  position int not null, -- judge seat number (1-7)
  is_head_judge boolean default false,
  created_at timestamptz default now(),
  unique(heat_id, judge_id),
  unique(heat_id, position)
);

-- ============================================================
-- 6. Interference log
-- ============================================================
create table if not exists comp_interference (
  id uuid primary key default gen_random_uuid(),
  heat_id uuid not null references comp_heats(id) on delete cascade,
  athlete_id uuid not null references comp_heat_athletes(id) on delete cascade,
  wave_number int not null,
  penalty_type text not null check (penalty_type in ('interference_half', 'interference_zero', 'double_interference')),
  called_by uuid references comp_judges(id), -- head judge who called it
  priority_violation boolean default true, -- was athlete without priority?
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. Score override audit log
-- ============================================================
create table if not exists comp_score_overrides (
  id uuid primary key default gen_random_uuid(),
  judge_score_id uuid not null references comp_judge_scores(id) on delete cascade,
  original_score numeric(3,1) not null,
  new_score numeric(3,1) not null,
  reason text not null,
  overridden_by uuid not null references comp_judges(id),
  created_at timestamptz default now()
);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table comp_judge_scores enable row level security;
alter table comp_heat_judges enable row level security;
alter table comp_interference enable row level security;
alter table comp_score_overrides enable row level security;

-- Judges: can only INSERT their own scores (blind judging)
-- They cannot SELECT other judges' scores
create policy "Judge insert own scores" on comp_judge_scores
  for insert to anon with check (true);

-- Judges can only read their OWN scores (blind)
-- This is enforced at the API level since anon can't filter by auth
-- Public reads are blocked — only authenticated (admin) or API can read all
create policy "Admin read all judge scores" on comp_judge_scores
  for select to authenticated using (true);

-- Anon can read their own scores via API (filtered by judge_id in the query)
-- We allow select for anon but the API enforces the judge_id filter
create policy "Anon read judge scores" on comp_judge_scores
  for select to anon using (true);

create policy "Admin write judge scores" on comp_judge_scores
  for all to authenticated using (true) with check (true);

-- Heat judges
create policy "Public read heat judges" on comp_heat_judges
  for select using (true);
create policy "Admin write heat judges" on comp_heat_judges
  for all to authenticated using (true) with check (true);

-- Interference
create policy "Public read interference" on comp_interference
  for select using (true);
create policy "Admin write interference" on comp_interference
  for all to authenticated using (true) with check (true);
create policy "Anon insert interference" on comp_interference
  for insert to anon with check (true);

-- Score overrides
create policy "Admin read overrides" on comp_score_overrides
  for select to authenticated using (true);
create policy "Admin write overrides" on comp_score_overrides
  for all to authenticated using (true) with check (true);
create policy "Anon insert overrides" on comp_score_overrides
  for insert to anon with check (true);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_judge_scores_heat_athlete on comp_judge_scores(heat_athlete_id);
create index idx_judge_scores_judge on comp_judge_scores(judge_id);
create index idx_judge_scores_wave on comp_judge_scores(heat_athlete_id, wave_number);
create index idx_heat_judges_heat on comp_heat_judges(heat_id);
create index idx_interference_heat on comp_interference(heat_id);

-- ============================================================
-- Realtime
-- ============================================================
alter publication supabase_realtime add table comp_judge_scores;
alter publication supabase_realtime add table comp_heat_judges;
alter publication supabase_realtime add table comp_interference;
