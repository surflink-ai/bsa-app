-- BSA Admin Backend — Initial Schema

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('super_admin', 'editor', 'event_manager')) default 'editor',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- News/Blog
create table articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  author_id uuid references profiles(id),
  author_name text not null default 'BSA',
  category text check (category in ('event-recap', 'athlete-spotlight', 'announcement', 'news', 'feature')) not null,
  featured_image text,
  published boolean default false,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sponsors
create table sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  tier text check (tier in ('platinum', 'gold', 'silver', 'bronze', 'supporter')) not null,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Event Photos
create table event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_name text,
  src text not null,
  alt text,
  credit text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Historical Champions
create table champions (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  division text not null,
  name text not null,
  image_url text,
  created_at timestamptz default now(),
  unique(year, division)
);

-- Surf Spots
create table surf_spots (
  id uuid primary key default gen_random_uuid(),
  surfline_spot_id text unique,
  name text not null,
  coast text check (coast in ('East', 'South', 'West')) not null,
  lat decimal,
  lon decimal,
  best_swell text,
  best_size text,
  offshore_wind text,
  break_type text,
  description text,
  admin_note text,
  priority int default 2,
  active boolean default true,
  created_at timestamptz default now()
);

-- Static Pages
create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now()
);

-- Push Notifications Log
create table notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text check (type in ('event', 'heat', 'conditions', 'announcement', 'custom')) not null,
  sent_at timestamptz default now(),
  sent_by uuid references profiles(id),
  recipient_count int default 0
);

-- Live Stream Config
create table stream_config (
  id uuid primary key default gen_random_uuid(),
  active boolean default false,
  stream_url text,
  embed_code text,
  title text,
  event_id text,
  updated_at timestamptz default now(),
  updated_by uuid references profiles(id)
);

-- Site Settings (key-value)
create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Fan Polls
create table fan_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  options jsonb not null,
  event_id text,
  active boolean default true,
  closes_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

-- Fan Votes
create table fan_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references fan_polls(id) on delete cascade,
  option_label text not null,
  voter_fingerprint text not null,
  created_at timestamptz default now(),
  unique(poll_id, voter_fingerprint)
);

-- Coaching Directory
create table coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  photo_url text,
  specialties text[],
  contact_email text,
  contact_phone text,
  website_url text,
  surflink_url text,
  bsa_certified boolean default false,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Create indexes
create index idx_articles_published on articles(published, published_at desc);
create index idx_articles_slug on articles(slug);
create index idx_sponsors_tier on sponsors(tier, sort_order);
create index idx_event_photos_event on event_photos(event_id, sort_order);
create index idx_champions_year on champions(year, division);
create index idx_surf_spots_coast on surf_spots(coast, priority);
create index idx_fan_votes_poll on fan_votes(poll_id);
create index idx_coaches_active on coaches(active, sort_order);

-- Insert default stream config row
insert into stream_config (active, title) values (false, 'BSA Live Stream');
