-- BSA Compete — Competition Management System

-- Reusable divisions (Open Men, Open Women, etc.)
create table if not exists comp_divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text, -- "OM", "OW", "U16B"
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Seasons (2026 SOTY Series, etc.)
create table if not exists comp_seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int not null,
  points_system jsonb default '{"1":1000,"2":800,"3":650,"4":500,"5":400,"6":300,"7":200,"8":100}'::jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

-- Competition events
create table if not exists comp_events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references comp_seasons(id) on delete set null,
  name text not null,
  location text,
  event_date date,
  end_date date,
  status text check (status in ('draft', 'active', 'complete', 'cancelled')) default 'draft',
  banner_image text,
  liveheats_id text, -- bridge: link to LiveHeats event during transition
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Which divisions are in which event
create table if not exists comp_event_divisions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references comp_events(id) on delete cascade,
  division_id uuid not null references comp_divisions(id) on delete cascade,
  max_athletes int default 32,
  waves_per_heat int default 10,
  ride_time_minutes int default 20,
  scoring_best_of int default 2, -- best N waves count
  advances_per_heat int default 2,
  created_at timestamptz default now(),
  unique(event_id, division_id)
);

-- Rounds within a division of an event
create table if not exists comp_rounds (
  id uuid primary key default gen_random_uuid(),
  event_division_id uuid not null references comp_event_divisions(id) on delete cascade,
  round_number int not null, -- 1=Round 1, 2=Round 2, etc. Highest = Final
  name text not null, -- "Round 1", "Quarterfinals", "Semifinals", "Final"
  format text check (format in ('standard', 'expression_session', 'man_on_man')) default 'standard',
  status text check (status in ('pending', 'active', 'complete')) default 'pending',
  created_at timestamptz default now(),
  unique(event_division_id, round_number)
);

-- Heats within a round
create table if not exists comp_heats (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references comp_rounds(id) on delete cascade,
  heat_number int not null,
  status text check (status in ('pending', 'live', 'complete')) default 'pending',
  scheduled_start timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  duration_minutes int default 20,
  created_at timestamptz default now(),
  unique(round_id, heat_number)
);

-- Athletes assigned to heats
create table if not exists comp_heat_athletes (
  id uuid primary key default gen_random_uuid(),
  heat_id uuid not null references comp_heats(id) on delete cascade,
  athlete_id uuid, -- references existing athletes table if available
  athlete_name text not null, -- denormalized for speed
  jersey_color text check (jersey_color in ('red', 'blue', 'white', 'yellow', 'green', 'black', 'pink', 'orange')),
  seed_position int,
  has_priority boolean default false,
  interference boolean default false,
  result_position int, -- final position in heat (set on completion)
  advanced boolean default false, -- did they advance to next round?
  created_at timestamptz default now(),
  unique(heat_id, athlete_name)
);

-- Judges (before wave_scores due to FK)
create table if not exists comp_judges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin text not null, -- 4-6 digit PIN for beach auth
  role text check (role in ('judge', 'head_judge', 'admin')) default 'judge',
  active boolean default true,
  created_at timestamptz default now()
);

-- Individual wave scores
create table if not exists comp_wave_scores (
  id uuid primary key default gen_random_uuid(),
  heat_athlete_id uuid not null references comp_heat_athletes(id) on delete cascade,
  wave_number int not null,
  score numeric(3,1) not null check (score >= 0 and score <= 10),
  judge_id uuid references comp_judges(id) on delete set null,
  is_override boolean default false,
  notes text,
  created_at timestamptz default now(),
  unique(heat_athlete_id, wave_number)
);

-- Event registrations (athletes entering a division)
create table if not exists comp_registrations (
  id uuid primary key default gen_random_uuid(),
  event_division_id uuid not null references comp_event_divisions(id) on delete cascade,
  athlete_id uuid,
  athlete_name text not null,
  seed_rank int,
  status text check (status in ('registered', 'confirmed', 'withdrawn', 'dns')) default 'registered',
  created_at timestamptz default now(),
  unique(event_division_id, athlete_name)
);

-- Season points (accumulated per athlete per season)
create table if not exists comp_season_points (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references comp_seasons(id) on delete cascade,
  division_id uuid not null references comp_divisions(id) on delete cascade,
  athlete_name text not null,
  athlete_id uuid,
  total_points int default 0,
  events_counted int default 0,
  best_result int, -- best finishing position
  updated_at timestamptz default now(),
  unique(season_id, division_id, athlete_name)
);

-- RLS policies
alter table comp_divisions enable row level security;
alter table comp_seasons enable row level security;
alter table comp_events enable row level security;
alter table comp_event_divisions enable row level security;
alter table comp_rounds enable row level security;
alter table comp_heats enable row level security;
alter table comp_heat_athletes enable row level security;
alter table comp_wave_scores enable row level security;
alter table comp_judges enable row level security;
alter table comp_registrations enable row level security;
alter table comp_season_points enable row level security;

-- Public read on everything (results are public)
create policy "Public read comp_divisions" on comp_divisions for select using (true);
create policy "Public read comp_seasons" on comp_seasons for select using (true);
create policy "Public read comp_events" on comp_events for select using (true);
create policy "Public read comp_event_divisions" on comp_event_divisions for select using (true);
create policy "Public read comp_rounds" on comp_rounds for select using (true);
create policy "Public read comp_heats" on comp_heats for select using (true);
create policy "Public read comp_heat_athletes" on comp_heat_athletes for select using (true);
create policy "Public read comp_wave_scores" on comp_wave_scores for select using (true);
create policy "Public read comp_registrations" on comp_registrations for select using (true);
create policy "Public read comp_season_points" on comp_season_points for select using (true);

-- Judges: public read name only (PIN hidden by column, not exposed in queries)
create policy "Public read comp_judges" on comp_judges for select using (true);

-- Admin write on everything
create policy "Admin write comp_divisions" on comp_divisions for all to authenticated using (true) with check (true);
create policy "Admin write comp_seasons" on comp_seasons for all to authenticated using (true) with check (true);
create policy "Admin write comp_events" on comp_events for all to authenticated using (true) with check (true);
create policy "Admin write comp_event_divisions" on comp_event_divisions for all to authenticated using (true) with check (true);
create policy "Admin write comp_rounds" on comp_rounds for all to authenticated using (true) with check (true);
create policy "Admin write comp_heats" on comp_heats for all to authenticated using (true) with check (true);
create policy "Admin write comp_heat_athletes" on comp_heat_athletes for all to authenticated using (true) with check (true);
create policy "Admin write comp_wave_scores" on comp_wave_scores for all to authenticated using (true) with check (true);
create policy "Admin write comp_judges" on comp_judges for all to authenticated using (true) with check (true);
create policy "Admin write comp_registrations" on comp_registrations for all to authenticated using (true) with check (true);
create policy "Admin write comp_season_points" on comp_season_points for all to authenticated using (true) with check (true);

-- Anon write on wave_scores and heat_athletes (judges use anon key + PIN)
create policy "Judge write wave_scores" on comp_wave_scores for insert to anon with check (true);
create policy "Judge update wave_scores" on comp_wave_scores for update to anon using (true);
create policy "Judge update heat_athletes" on comp_heat_athletes for update to anon using (true);
create policy "Judge update heats" on comp_heats for update to anon using (true);

-- Enable realtime on scoring tables
alter publication supabase_realtime add table comp_heats;
alter publication supabase_realtime add table comp_heat_athletes;
alter publication supabase_realtime add table comp_wave_scores;

-- Index for fast lookups
create index idx_comp_heats_status on comp_heats(status);
create index idx_comp_heat_athletes_heat on comp_heat_athletes(heat_id);
create index idx_comp_wave_scores_athlete on comp_wave_scores(heat_athlete_id);
create index idx_comp_events_status on comp_events(status);
create index idx_comp_rounds_division on comp_rounds(event_division_id);
