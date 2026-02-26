-- BSA App Database Schema

-- User profiles (extends auth.users)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  role text not null default 'user' check (role in ('user', 'athlete', 'admin')),
  created_at timestamptz not null default now()
);

-- Athlete profiles (keyed by LiveHeats athlete ID)
create table if not exists public.athlete_profiles (
  liveheats_id text primary key,
  name text not null,
  bio text,
  stance text default 'unknown' check (stance in ('regular', 'goofy', 'unknown')),
  home_break text,
  photo_url text,
  instagram text,
  twitter text,
  nationality text,
  dob date,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Athlete claim requests
create table if not exists public.athlete_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  liveheats_athlete_id text not null,
  athlete_name text not null,
  proof text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS Policies

alter table public.user_profiles enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.athlete_claims enable row level security;

-- user_profiles: public read, users edit own
create policy "Public read user_profiles" on public.user_profiles for select using (true);
create policy "Users update own profile" on public.user_profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.user_profiles for insert with check (auth.uid() = id);

-- athlete_profiles: public read, claimed owner can edit
create policy "Public read athlete_profiles" on public.athlete_profiles for select using (true);
create policy "Claimed owner update athlete_profiles" on public.athlete_profiles for update using (auth.uid() = claimed_by);
create policy "Anyone can insert athlete_profiles" on public.athlete_profiles for insert with check (true);

-- athlete_claims: users insert own, admins view all
create policy "Users insert own claims" on public.athlete_claims for insert with check (auth.uid() = user_id);
create policy "Users view own claims" on public.athlete_claims for select using (
  auth.uid() = user_id
  or exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins update claims" on public.athlete_claims for update using (
  exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
