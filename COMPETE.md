# BSA Compete — Competition Management System

## Overview

BSA Compete is a full surf competition management system built into bsa.surf. It replaces LiveHeats for event scoring, live results, and season rankings.

## URLs

| Page | URL | Purpose |
|------|-----|---------|
| Admin Events | `/admin/compete` | Create/manage competition events |
| Admin Judges | `/admin/compete/judges` | Manage judges and PINs |
| Event Builder | `/admin/compete/[id]` | Brackets, registrations, draw |
| Print Heat Sheets | `/admin/compete/[id]/print` | Printable heat sheets for judges |
| Judge Scoring | `/judge` | Mobile scoring interface (PIN login) |
| Live Results | `/events/[id]/live` | Public real-time scores for fans |
| Public Registration | `/events/[id]/register` | Athletes self-register for events |
| Rankings | `/rankings` | Season standings with division filters |
| Athletes | `/athletes` | Athlete directory (local DB + LiveHeats) |

## How It Works

### Full Event Flow

1. **Create Event** → `/admin/compete` → "New Event"
2. **Add Divisions** → Open Men, Open Women, etc.
3. **Open Registration** → Toggle on the Registrations tab (or share `/events/[id]/register`)
4. **Register Athletes** → Admin registers them, athletes self-register, or CSV import
5. **Auto-Seed** → 🎯 button ranks by SOTY points, randomizes unranked
6. **Generate Draw** → 🎲 button snake-seeds athletes into heats, preview before confirming
7. **Run Event** → Start heats, judges score, auto-advance between rounds
8. **Results** → Live at `/events/[id]/live`, rankings auto-update

### Athlete Registry

109 athletes imported from LiveHeats into local Supabase `athletes` table.

- **Search/autocomplete** when adding athletes to heats or registering
- **Quick-add** inline if athlete not found (creates new record)
- **Athlete profiles** at `/athletes/[id]` show both LiveHeats history and BSA Compete results
- **Import API** at `/api/athletes/import` pulls new athletes from LiveHeats

### Event Registration

**Admin Registration (Registrations tab):**
- Per-division registration lists with athlete count / max capacity
- Inline status dropdowns: pending → confirmed → waitlist → withdrawn → DNS
- Payment tracking: free / pending / paid / refunded
- Auto-Seed button: ranks athletes by season points
- Generate Draw button: creates brackets from registered athletes
- CSV Import: paste CSV with Name, Email, Phone columns
- CSV Export: download registrations or results

**Public Registration (`/events/[id]/register`):**
- Division picker showing spots remaining / max capacity
- Full divisions shown as disabled
- Duplicate detection (can't register same name twice)
- Auto-links to existing athlete records
- Fields: Name (required), Email, Phone, Emergency Contact

**Registration Controls:**
- Open/Close toggle on admin Registrations tab
- Registration fee setting on event

### Smart Seeding & Auto-Draw

**Auto-Seed (🎯):**
- Pulls season points from `comp_season_points` for the event's season + division
- Ranked athletes sorted by points (descending)
- Unranked athletes randomized among themselves
- Manual override: edit seed numbers inline

**Auto-Draw (🎲):**
- Takes seeded registration list and distributes across Round 1 heats
- **Snake seeding** ensures top seeds are separated (e.g., seeds 1+4+5+8 in Heat 1, seeds 2+3+6+7 in Heat 2)
- Preview mode shows proposed heats before confirming
- Re-shuffle button for different random distribution
- Configurable athletes per heat (2-6)
- Auto-creates full bracket structure (all rounds + heats)
- Auto-assigns jersey colors

**Walk-Up Add:**
- For late entries on event day
- Search athlete → auto-slots into least-full Round 1 heat
- Auto-assigns next available jersey color

### Bracket Generation

- **Input:** Number of athletes + athletes per heat + advances per heat (default 2)
- **Output:** Correct number of rounds and heats
- **Example:** 32 athletes, 4 per heat, top 2 advance = Round 1 (8 heats) → Quarters (4) → Semis (2) → Final (1)
- A live preview shows the bracket structure before generating

### Judge Scoring

1. Go to `/admin/compete/judges` → "Add Judge"
2. Set a name, PIN (auto-generated or custom), and role (judge or head_judge)
3. On event day, judges open `bsa.surf/judge` on their phone
4. Enter their PIN to log in
5. They see all live heats — tap an athlete to expand, enter wave scores
6. Quick-score buttons: 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 9.5, 10.0
7. Scores sync in real-time across all devices via Supabase Realtime

### Scoring Rules

- Waves scored 0.0–10.0 (one decimal)
- Best 2 of N waves count (configurable per division)
- Highest total wins
- Head judges can override/delete scores

### Running a Heat

1. Admin clicks "Start" on a heat card → status changes to LIVE
2. Heat appears on judge devices and public live results page
3. Judges enter wave scores in real-time
4. When heat is done, admin clicks "End" → status changes to COMPLETE
5. **Auto-advancement:** When ALL heats in a round are complete, advancing athletes are automatically seeded into the next round using snake seeding

### Live Results for Fans

Send fans to `bsa.surf/events/[event-id]/live`:
- Real-time scores update automatically (Supabase Realtime)
- Division tabs with live indicator dots
- Active heat gets a spotlight view with jersey colors and wave breakdown
- Completed heats show final results

### Stream Overlay

When streaming live at `bsa.surf/stream`:
- The score overlay automatically pulls from BSA Compete
- Shows current live heat with athlete names, positions, and totals
- Updates every 5 seconds
- Toggle overlay on/off with button on player

### Season Rankings

`bsa.surf/rankings`:
- Automatically calculated from completed events
- Points system configurable per season (default: 1st=1000, 2nd=800, 3rd=650, etc.)
- Filter by division
- Expandable rows show per-event results

## Database Tables

All tables use the `comp_` prefix to avoid collisions:

| Table | Purpose |
|-------|---------|
| `athletes` | Local athlete registry (imported from LiveHeats + new) |
| `comp_divisions` | Reusable divisions (Open Men, U16 Boys, etc.) |
| `comp_seasons` | Season config + points system |
| `comp_events` | Competition events + registration settings |
| `comp_event_divisions` | Which divisions are in which event + scoring config |
| `comp_rounds` | Rounds within a division (R1, Quarters, Semis, Final) |
| `comp_heats` | Individual heats with status |
| `comp_heat_athletes` | Athletes assigned to heats with jersey colors |
| `comp_wave_scores` | Individual wave scores |
| `comp_judges` | Judge names, PINs, roles |
| `comp_registrations` | Event registrations with seeding + payment |
| `comp_season_points` | Cached season rankings |

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/athletes/search` | GET | Athlete autocomplete (`?q=name&limit=10`) |
| `/api/athletes/import` | POST | Import athletes from LiveHeats |
| `/api/judge/auth` | POST | Judge PIN authentication |
| `/api/judge/score` | POST/DELETE | Submit or delete wave scores |
| `/api/compete/advance` | POST | Auto-advance athletes from completed heat |
| `/api/compete/seed` | POST | Auto-seed registrations by ranking points |
| `/api/compete/draw` | POST | Generate draw (preview or confirm) |
| `/api/compete/import` | POST | CSV bulk-import registrations |
| `/api/compete/export` | GET | CSV export (`?event_id=x&type=registrations\|results`) |
| `/api/stream/active-heat` | GET | Current live heat for stream overlay |
| `/api/rankings` | GET | Season rankings calculation |

## LiveHeats Transition

BSA Compete runs alongside LiveHeats. Current state:
- `/events/[id]` (event detail) → Still uses LiveHeats API
- `/events/[id]/live` → Uses BSA Compete
- `/events/[id]/register` → Uses BSA Compete
- `/rankings` → Uses BSA Compete (fallback to LiveHeats if no data)
- `/athletes` → Uses local DB + LiveHeats event counts
- `/stream` overlay → Uses BSA Compete
- `/judge` → Uses BSA Compete

To run an event on BSA Compete:
1. Create the event in `/admin/compete`
2. Open registration → register athletes (or share public form)
3. Auto-seed → Generate draw
4. Set up judges at `/admin/compete/judges`
5. Share `bsa.surf/judge` with judges, `bsa.surf/events/[id]/live` with fans
6. LiveHeats can still run in parallel as backup

## Seeded Divisions

13 divisions pre-configured:
Open Men, Open Women, Under 18 Boys/Girls, Under 16 Boys/Girls, Under 14 Boys/Girls, Under 12, Longboard Open, Bodyboard Open, Masters, Grand Masters

## Points System (Default)

| Position | Points |
|----------|--------|
| 1st | 1000 |
| 2nd | 800 |
| 3rd | 650 |
| 4th | 500 |
| 5th | 400 |
| 6th | 300 |
| 7th | 200 |
| 8th | 100 |

Configurable per season in `comp_seasons.points_system` (JSON).

## Migrations

| File | Content |
|------|---------|
| `006_competition_system.sql` | Core comp tables (11 tables) |
| `007_seed_divisions.sql` | 13 divisions + 2026 SOTY season |
| `008_stream_score_source.sql` | Stream overlay config |
| `009_athletes_table.sql` | Local athletes registry + FK links |
| `010_registration_upgrades.sql` | Registration payment, contact fields, event registration settings |
