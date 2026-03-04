-- BSA Compete — Registration System Upgrades
-- Applied: 2026-03-04

-- Add missing columns to comp_registrations
alter table comp_registrations
  add column if not exists payment_status text check (payment_status in ('free', 'pending', 'paid', 'refunded')) default 'free',
  add column if not exists payment_amount numeric(8,2),
  add column if not exists payment_reference text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists emergency_contact text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

-- Update status check to include more states
-- Drop old constraint and add new one
alter table comp_registrations drop constraint if exists comp_registrations_status_check;
alter table comp_registrations add constraint comp_registrations_status_check
  check (status in ('pending', 'registered', 'confirmed', 'waitlist', 'withdrawn', 'dns'));

-- Add registration settings to comp_events
alter table comp_events
  add column if not exists registration_open boolean default false,
  add column if not exists registration_opens_at timestamptz,
  add column if not exists registration_closes_at timestamptz,
  add column if not exists registration_fee numeric(8,2) default 0,
  add column if not exists registration_notes text;

-- Allow anon insert on registrations (public registration form)
create policy "Anon insert registrations" on comp_registrations for insert to anon with check (true);

-- Index for fast lookups
create index if not exists idx_comp_registrations_event_div on comp_registrations(event_division_id);
create index if not exists idx_comp_registrations_athlete on comp_registrations(athlete_id);
create index if not exists idx_comp_registrations_status on comp_registrations(status);
