-- ============================================================
-- 021 · Security hardening
--
-- Fixes the highest-severity findings from the July 2026 audit:
--   1. New signups no longer become admins (default role 'athlete').
--   2. Users can no longer escalate their own role.
--   3. Anonymous users can no longer forge competition scores/results.
--   4. "any authenticated user" write policies scoped to real admins.
--   5. Leftover open athlete policies removed; safe claim flow added.
--   6. Blast/audit write policies added so messaging works under strict RLS.
--
-- Idempotent where practical; safe to run once against production.
-- ============================================================

-- ── 1. Roles: introduce a non-admin 'athlete' role ──────────
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'editor', 'event_manager', 'athlete'));
alter table profiles alter column role set default 'athlete';

-- New auth users get the non-admin 'athlete' role (was 'editor' = full admin).
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'athlete'
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── 2. Assign the designated super admin; demote everyone else ──
-- Defensive: only demote if we can positively identify the super admin,
-- so we never lock the org out of its own admin panel.
do $$
declare
  admin_uid uuid;
begin
  select id into admin_uid from auth.users where lower(email) = 'paew82@gmail.com' limit 1;

  if admin_uid is not null then
    insert into public.profiles (id, role)
    values (admin_uid, 'super_admin')
    on conflict (id) do update set role = 'super_admin';

    update public.profiles set role = 'athlete'
    where id <> admin_uid and role <> 'super_admin';

    raise notice 'super_admin set to paew82@gmail.com (%); other non-super profiles demoted to athlete', admin_uid;
  else
    -- Fallback: at minimum strip the dangerous auto-assigned admin roles,
    -- but keep existing super_admins so the panel stays reachable.
    update public.profiles set role = 'athlete'
    where role in ('editor', 'event_manager');
    raise notice 'paew82@gmail.com not found in auth.users; demoted editor/event_manager to athlete, kept existing super_admins';
  end if;
end $$;

-- ── 3. Prevent self-service role escalation ────────────────
create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$ language sql security definer;

create or replace function public.guard_profile_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role and not public.is_super_admin() then
    raise exception 'Only a super_admin can change a profile role';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_guard_profile_role on profiles;
create trigger trg_guard_profile_role
  before update on profiles
  for each row execute procedure public.guard_profile_role_change();

-- Users may still update their own non-role fields; admins update anyone.
drop policy if exists "Admins can update profiles" on profiles;
create policy "Users update own profile or admins update any" on profiles
  for update using (is_admin() or auth.uid() = id);

-- ── 4. Competition tables: remove anonymous write access ────
drop policy if exists "Judge write wave_scores" on comp_wave_scores;
drop policy if exists "Judge update wave_scores" on comp_wave_scores;
drop policy if exists "Judge update heat_athletes" on comp_heat_athletes;
drop policy if exists "Judge update heats" on comp_heats;
drop policy if exists "Anon insert registrations" on comp_registrations;

-- Scope "admin write" policies to actual admins (were: any authenticated user).
do $$
declare
  t text;
  tables text[] := array[
    'comp_divisions','comp_seasons','comp_events','comp_event_divisions',
    'comp_rounds','comp_heats','comp_heat_athletes','comp_wave_scores',
    'comp_registrations','comp_season_points'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on %I', 'Admin write ' || t, t);
    execute format(
      'create policy %I on %I for all using (is_admin()) with check (is_admin())',
      'Admin manage ' || t, t
    );
  end loop;
end $$;

-- stream_videos: was writable by any authenticated user.
drop policy if exists "Admin insert stream_videos" on stream_videos;
drop policy if exists "Admin update stream_videos" on stream_videos;
drop policy if exists "Admin delete stream_videos" on stream_videos;
create policy "Admin manage stream_videos" on stream_videos
  for all using (is_admin()) with check (is_admin());

-- ── 5. Athletes: drop leftover open policies, add safe claim flow ──
drop policy if exists "Admin write athletes" on athletes;   -- 009: to authenticated using(true)
drop policy if exists "Anon insert athletes" on athletes;   -- 009: anon insert
drop policy if exists "Athletes update own profile" on athletes;
drop policy if exists "Admin full athletes" on athletes;

create policy "Admin manage athletes" on athletes
  for all using (is_admin()) with check (is_admin());

-- A logged-in user may claim an UNCLAIMED athlete for themselves, or edit a
-- profile they already own. Gate fields (claim_status/verified/claimed_by) are
-- protected by the trigger below so athletes cannot self-approve.
create policy "Athlete claim unclaimed" on athletes
  for update to authenticated
  using (claimed_by is null)
  with check (claimed_by = auth.uid());

create policy "Athlete update own profile" on athletes
  for update to authenticated
  using (claimed_by = auth.uid())
  with check (claimed_by = auth.uid());

create or replace function public.guard_athlete_claim()
returns trigger as $$
begin
  if is_admin() then
    return new;
  end if;
  if old.claimed_by is null then
    -- Claiming: force safe values regardless of what the client sent.
    if new.claimed_by is distinct from auth.uid() then
      raise exception 'You can only claim a profile for yourself';
    end if;
    new.claim_status := 'pending';
    new.verified := coalesce(old.verified, false);
    return new;
  end if;
  -- Already claimed: owner may edit content but not the gate fields.
  new.claimed_by := old.claimed_by;
  new.claim_status := old.claim_status;
  new.verified := old.verified;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_guard_athlete_claim on athletes;
create trigger trg_guard_athlete_claim
  before update on athletes
  for each row execute procedure public.guard_athlete_claim();

-- ── 6. Messaging/audit write policies (were SELECT-only) ────
create policy "Admin write templates" on blast_templates
  for all using (is_admin()) with check (is_admin());
create policy "Admin write recipients" on blast_recipients
  for all using (is_admin()) with check (is_admin());
create policy "Admin insert audit" on audit_log
  for insert with check (is_admin());

-- ── 7. Completeness: admin delete on admin-only CMS tables ──
create policy "Admins can delete pages" on pages for delete using (is_admin());
create policy "Admins can delete settings" on site_settings for delete using (is_admin());
create policy "Admins can update notifications" on notifications for update using (is_admin());
create policy "Admins can delete notifications" on notifications for delete using (is_admin());
