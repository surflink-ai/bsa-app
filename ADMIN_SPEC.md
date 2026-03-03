# BSA Admin Backend — Full Specification

## Overview
Build a complete admin backend for the Barbados Surfing Association website. The admin panel lives at `/admin` (protected routes). All content currently hardcoded in TypeScript files must migrate to Supabase.

## Tech Stack
- **Framework:** Next.js (already in use, App Router)
- **Database:** Supabase (Postgres + Auth + Storage + RLS)
- **UI:** Tailwind CSS (already configured)
- **Auth:** Supabase Auth with role-based access
- **Storage:** Supabase Storage for images/media
- **Design:** Match existing BSA design system (Navy #0A2540, Teal #2BA5A0, Blue #1478B5, fonts: Space Grotesk, JetBrains Mono, DM Sans)

## Phase 1: Foundation

### 1.1 Supabase Setup
Create a NEW Supabase project for BSA (don't reuse existing ones).
- Project name: `bsa-admin`
- Region: US East (closest to Barbados)
- Generate all tables via SQL migrations in `supabase/migrations/`
- Use Supabase CLI for local dev: `npx supabase init` + `npx supabase start`

### 1.2 Auth & Roles
- Supabase Auth with email/password
- Roles table: `super_admin`, `editor`, `event_manager`
- RLS policies on ALL tables — admins only for writes, public reads where needed
- Admin middleware at `/admin` — redirect to `/admin/login` if unauthenticated
- First user seeds as super_admin

### 1.3 Database Schema

```sql
-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id),
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
  event_id text not null, -- LiveHeats event ID
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

-- Surf Spots (admin-managed, replaces hardcoded surfline.ts BARBADOS_SPOTS)
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
  admin_note text, -- Admin override note shown on conditions page
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
  event_id text, -- LiveHeats event ID
  updated_at timestamptz default now(),
  updated_by uuid references profiles(id)
);

-- Site Settings (key-value for flexible config)
create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Fan Votes
create table fan_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null,
  poll_title text not null,
  option_label text not null,
  voter_fingerprint text not null, -- browser fingerprint for anon voting
  created_at timestamptz default now(),
  unique(poll_id, voter_fingerprint)
);

-- Fan Polls (admin creates)
create table fan_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  options jsonb not null, -- [{label: "...", id: "..."}]
  event_id text,
  active boolean default true,
  closes_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

-- Coaching Directory
create table coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  photo_url text,
  specialties text[], -- e.g. ['beginner', 'competition', 'kids']
  contact_email text,
  contact_phone text,
  website_url text,
  surflink_url text, -- Link to SurfLink profile
  bsa_certified boolean default false,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
```

### 1.4 RLS Policies
- Public SELECT on: articles (where published=true), sponsors (where active=true), event_photos, champions, surf_spots (where active=true), pages, fan_polls (where active=true), coaches (where active=true), stream_config
- INSERT/UPDATE/DELETE restricted to authenticated users with admin roles
- fan_votes: public INSERT (one per fingerprint per poll), public SELECT for counts

## Phase 2: Admin Panel UI

### 2.1 Layout
- `/admin` — Dashboard overview (stats, recent activity, quick actions)
- `/admin/login` — Auth page
- Sidebar navigation with sections:
  - Dashboard
  - Content (Articles, Pages, Photos)
  - Events (Calendar, Live Stream, Scoring, Polls)
  - People (Athletes, Coaches, Admins)
  - Surf (Spots, Conditions Override)
  - Sponsors
  - Notifications
  - Settings

### 2.2 Dashboard
- Total athletes, events, articles count
- Recent articles (draft/published)
- Live stream status (on/off toggle)
- Active polls
- Quick actions: New Article, Send Notification, Toggle Stream

### 2.3 Article Editor
- Rich text editor (use Tiptap — lightweight, extensible, works well with Next.js)
- Title, slug (auto-generated from title), excerpt, category selector
- Featured image upload (Supabase Storage)
- Publish / Save Draft / Schedule
- Preview button
- SEO fields (meta description, og:image)

### 2.4 Photo Manager
- Drag-and-drop upload (multiple files)
- Assign to LiveHeats event (dropdown populated from LiveHeats API)
- Reorder with drag-and-drop
- Add alt text and photographer credit
- Bulk upload support

### 2.5 Sponsor Manager
- Add/edit sponsor: name, logo upload, website, tier
- Drag to reorder within tiers
- Toggle active/inactive
- Preview of how sponsor wall looks on frontend

### 2.6 Champions Manager
- Year selector
- Add champion per division
- Bulk import from LiveHeats (button: "Import from LiveHeats" — pulls final results)
- Edit existing records, add profile images

### 2.7 Live Stream Control
- Toggle on/off (big obvious switch)
- Set stream URL (YouTube/Vimeo embed)
- Set associated event
- Preview embed
- When active, shows banner on frontend homepage

### 2.8 Push Notifications
- Compose: title, body, type
- Preview on mock phone
- Send to all subscribers
- History log of sent notifications
- Quick templates: "Heat Starting", "Finals Live", "Results Posted"

### 2.9 Fan Polls
- Create poll: title, options (add/remove), closing time
- Link to event (optional)
- Live results view with bar chart
- Close/archive polls
- Display on frontend event pages when active

### 2.10 Coaching Directory
- Add/edit coaches
- Upload photo
- Set specialties (tag selector)
- BSA Certified badge toggle
- Optional SurfLink profile link
- Reorder

### 2.11 Surf Spots Manager
- List all spots with Surfline data
- Edit descriptions, admin notes
- Toggle active/inactive
- Add new spots (with lat/lon picker on map)
- Set priority (affects ordering in reports)

### 2.12 Site Settings
- Social links (Instagram, Facebook, Twitter, YouTube)
- Contact info
- About text
- Registration link
- BSA constitution/rules PDF upload

### 2.13 Admin User Management (super_admin only)
- Invite new admin (sends email)
- Assign/change roles
- Deactivate accounts

## Phase 3: Frontend Migration

### 3.1 Replace Hardcoded Data
Replace all imports from `src/lib/news.ts`, `src/lib/sponsors.ts`, `src/lib/photos.ts`, `src/lib/history.ts` with Supabase queries.

- `getArticles()` → Supabase query on `articles` table (published=true, ordered by published_at desc)
- `getSponsorsByTier()` → Supabase query on `sponsors` table (active=true, grouped by tier)
- `getEventPhotos(eventId)` → Supabase query on `event_photos` table
- `getChampionsByYear()` → Supabase query on `champions` table
- Keep LiveHeats API for events/athletes/results (that stays dynamic)
- Keep Surfline API for conditions (that stays dynamic)

### 3.2 New Frontend Features
- Live stream banner on homepage (when stream_config.active = true)
- Fan poll widget on event detail pages
- Coaching directory page `/coaches`
- Admin notes overlay on surf conditions (when admin_note is set)

### 3.3 Seed Data
Migrate ALL existing hardcoded data to Supabase seed:
- 4+ articles from news.ts
- 40+ champions from history.ts
- 21 surf spots from surfline.ts
- Pages: About BSA, Junior Development

## Implementation Notes

### Dependencies to Add
```
@tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
@supabase/supabase-js (already installed)
@supabase/ssr (already installed)
react-dropzone (photo uploads)
@dnd-kit/core @dnd-kit/sortable (drag and drop reordering)
```

### File Structure
```
src/
  app/
    admin/
      layout.tsx          — Admin shell (sidebar + auth guard)
      page.tsx            — Dashboard
      login/page.tsx      — Login
      articles/
        page.tsx          — List
        new/page.tsx      — Create
        [id]/edit/page.tsx — Edit
      photos/page.tsx
      sponsors/page.tsx
      champions/page.tsx
      stream/page.tsx
      notifications/page.tsx
      polls/page.tsx
      coaches/page.tsx
      spots/page.tsx
      settings/page.tsx
      users/page.tsx
    coaches/page.tsx      — Public coaching directory
  lib/
    supabase/
      client.ts           — (exists)
      server.ts           — (exists)
      admin.ts            — Server-side admin queries
      middleware.ts        — Auth middleware for admin routes
    db/
      articles.ts         — Article CRUD
      sponsors.ts         — Sponsor CRUD
      photos.ts           — Photo CRUD
      champions.ts        — Champion CRUD
      spots.ts            — Spot CRUD
      coaches.ts          — Coach CRUD
      polls.ts            — Poll CRUD
      settings.ts         — Settings CRUD
      notifications.ts    — Notification CRUD
      stream.ts           — Stream config CRUD
  components/
    admin/
      Sidebar.tsx
      DashboardCard.tsx
      ArticleEditor.tsx
      PhotoUploader.tsx
      SponsorForm.tsx
      PollCreator.tsx
      NotificationComposer.tsx
      StreamToggle.tsx
      DataTable.tsx        — Reusable admin data table
supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_seed_data.sql
  config.toml
```

### Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    (server-side only, for admin operations)
```

### Design Guidelines
- Admin panel: clean, functional, not fancy — white bg, navy accents, teal buttons
- Use existing BSA design tokens where possible
- Mobile-responsive admin (BSA admins may use phones at events)
- Loading states on all async operations
- Toast notifications for success/error feedback
- Confirm dialogs for destructive actions (delete)

### Quality Checklist
- [ ] All Supabase migrations run cleanly
- [ ] RLS policies prevent unauthorized access
- [ ] All CRUD operations work end-to-end
- [ ] Existing frontend pages work with Supabase data (no regressions)
- [ ] Image uploads work via Supabase Storage
- [ ] Article editor saves and renders rich text
- [ ] Live stream toggle reflects on frontend
- [ ] Fan polls accept votes and show results
- [ ] Admin panel is responsive on mobile
- [ ] Seed data includes all existing hardcoded content
- [ ] No TypeScript errors
- [ ] Build succeeds (`npm run build`)
