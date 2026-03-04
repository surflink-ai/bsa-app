-- BSA Athletes Registry — Local athlete database
-- Replaces LiveHeats as source of truth for athletes
-- Applied: 2026-03-04

create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  stance text check (stance in ('regular', 'goofy')),
  nationality text default 'Barbados',
  image_url text,
  bio text,
  liveheats_id text unique, -- bridge: original LiveHeats athlete ID
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for athlete name search
create index idx_athletes_name_lower on athletes (lower(name));
create index idx_athletes_active on athletes (active);
create index idx_athletes_liveheats on athletes (liveheats_id) where liveheats_id is not null;

-- RLS
alter table athletes enable row level security;
create policy "Public read athletes" on athletes for select using (true);
create policy "Admin write athletes" on athletes for all to authenticated using (true) with check (true);
-- Anon insert for public registration (future)
create policy "Anon insert athletes" on athletes for insert to anon with check (true);

-- Add FK from comp_heat_athletes to athletes
-- (athlete_id column already exists, just add the constraint)
alter table comp_heat_athletes
  add constraint fk_heat_athletes_athlete
  foreign key (athlete_id) references athletes(id) on delete set null;

-- Add FK from comp_registrations to athletes
alter table comp_registrations
  add constraint fk_registrations_athlete
  foreign key (athlete_id) references athletes(id) on delete set null;

-- Add FK from comp_season_points to athletes
alter table comp_season_points
  add constraint fk_season_points_athlete
  foreign key (athlete_id) references athletes(id) on delete set null;
