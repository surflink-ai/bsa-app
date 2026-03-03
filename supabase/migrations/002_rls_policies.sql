-- BSA Admin Backend — RLS Policies

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table articles enable row level security;
alter table sponsors enable row level security;
alter table event_photos enable row level security;
alter table champions enable row level security;
alter table surf_spots enable row level security;
alter table pages enable row level security;
alter table notifications enable row level security;
alter table stream_config enable row level security;
alter table site_settings enable row level security;
alter table fan_polls enable row level security;
alter table fan_votes enable row level security;
alter table coaches enable row level security;

-- Helper function: check if current user is admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('super_admin', 'editor', 'event_manager')
  );
$$ language sql security definer;

-- PROFILES
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Admins can insert profiles" on profiles for insert with check (is_admin() or auth.uid() = id);
create policy "Admins can update profiles" on profiles for update using (is_admin() or auth.uid() = id);

-- ARTICLES
create policy "Published articles are viewable by everyone" on articles for select using (published = true or is_admin());
create policy "Admins can insert articles" on articles for insert with check (is_admin());
create policy "Admins can update articles" on articles for update using (is_admin());
create policy "Admins can delete articles" on articles for delete using (is_admin());

-- SPONSORS
create policy "Active sponsors are viewable by everyone" on sponsors for select using (active = true or is_admin());
create policy "Admins can insert sponsors" on sponsors for insert with check (is_admin());
create policy "Admins can update sponsors" on sponsors for update using (is_admin());
create policy "Admins can delete sponsors" on sponsors for delete using (is_admin());

-- EVENT PHOTOS
create policy "Event photos are viewable by everyone" on event_photos for select using (true);
create policy "Admins can insert event photos" on event_photos for insert with check (is_admin());
create policy "Admins can update event photos" on event_photos for update using (is_admin());
create policy "Admins can delete event photos" on event_photos for delete using (is_admin());

-- CHAMPIONS
create policy "Champions are viewable by everyone" on champions for select using (true);
create policy "Admins can insert champions" on champions for insert with check (is_admin());
create policy "Admins can update champions" on champions for update using (is_admin());
create policy "Admins can delete champions" on champions for delete using (is_admin());

-- SURF SPOTS
create policy "Active spots are viewable by everyone" on surf_spots for select using (active = true or is_admin());
create policy "Admins can insert spots" on surf_spots for insert with check (is_admin());
create policy "Admins can update spots" on surf_spots for update using (is_admin());
create policy "Admins can delete spots" on surf_spots for delete using (is_admin());

-- PAGES
create policy "Pages are viewable by everyone" on pages for select using (true);
create policy "Admins can insert pages" on pages for insert with check (is_admin());
create policy "Admins can update pages" on pages for update using (is_admin());

-- NOTIFICATIONS
create policy "Admins can view notifications" on notifications for select using (is_admin());
create policy "Admins can insert notifications" on notifications for insert with check (is_admin());

-- STREAM CONFIG
create policy "Stream config is viewable by everyone" on stream_config for select using (true);
create policy "Admins can update stream config" on stream_config for update using (is_admin());

-- SITE SETTINGS
create policy "Site settings are viewable by everyone" on site_settings for select using (true);
create policy "Admins can insert settings" on site_settings for insert with check (is_admin());
create policy "Admins can update settings" on site_settings for update using (is_admin());

-- FAN POLLS
create policy "Active polls are viewable by everyone" on fan_polls for select using (active = true or is_admin());
create policy "Admins can insert polls" on fan_polls for insert with check (is_admin());
create policy "Admins can update polls" on fan_polls for update using (is_admin());
create policy "Admins can delete polls" on fan_polls for delete using (is_admin());

-- FAN VOTES
create policy "Anyone can view vote counts" on fan_votes for select using (true);
create policy "Anyone can vote once per poll" on fan_votes for insert with check (true);

-- COACHES
create policy "Active coaches are viewable by everyone" on coaches for select using (active = true or is_admin());
create policy "Admins can insert coaches" on coaches for insert with check (is_admin());
create policy "Admins can update coaches" on coaches for update using (is_admin());
create policy "Admins can delete coaches" on coaches for delete using (is_admin());

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'editor');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
