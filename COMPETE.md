# BSA Compete — Competition Management System

## Overview

BSA Compete is a full surf competition management system built into bsa.surf. It replaces LiveHeats for event scoring, live results, and season rankings.

## URLs

| Page | URL | Purpose |
|------|-----|---------|
| Admin Events | `/admin/compete` | Create/manage competition events |
| Admin Judges | `/admin/compete/judges` | Manage judges and PINs |
| Event Builder | `/admin/compete/[id]` | Add divisions, generate brackets, assign athletes |
| Print Heat Sheets | `/admin/compete/[id]/print` | Printable heat sheets for judges |
| Judge Scoring | `/judge` | Mobile scoring interface (PIN login) |
| Live Results | `/events/[id]/live` | Public real-time scores for fans |
| Rankings | `/rankings` | Season standings with division filters |

## How It Works

### Setting Up an Event

1. Go to `/admin/compete` → "New Event"
2. Enter name, location, date, and assign a season
3. On the event detail page, click "Add Division" (e.g., Open Men, Open Women)
4. Click "Generate Bracket" — enter number of athletes and athletes per heat
5. The system auto-calculates rounds (Round 1 → Quarters → Semis → Final)
6. Assign athletes to heats with jersey colors

### Bracket Generation

The bracket calculator works like this:
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
| `comp_divisions` | Reusable divisions (Open Men, U16 Boys, etc.) |
| `comp_seasons` | Season config + points system |
| `comp_events` | Competition events |
| `comp_event_divisions` | Which divisions are in which event + scoring config |
| `comp_rounds` | Rounds within a division (R1, Quarters, Semis, Final) |
| `comp_heats` | Individual heats with status |
| `comp_heat_athletes` | Athletes assigned to heats with jersey colors |
| `comp_wave_scores` | Individual wave scores |
| `comp_judges` | Judge names, PINs, roles |
| `comp_registrations` | Event registrations |
| `comp_season_points` | Cached season rankings |

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/judge/auth` | POST | Judge PIN authentication |
| `/api/judge/score` | POST/DELETE | Submit or delete wave scores |
| `/api/compete/advance` | POST | Auto-advance athletes from completed heat |
| `/api/stream/active-heat` | GET | Current live heat for stream overlay |
| `/api/rankings` | GET | Season rankings calculation |

## LiveHeats Transition

BSA Compete runs alongside LiveHeats. Current state:
- `/events/[id]` (event detail) → Still uses LiveHeats API
- `/events/[id]/live` → Uses BSA Compete
- `/rankings` → Uses BSA Compete
- `/stream` overlay → Uses BSA Compete
- `/judge` → Uses BSA Compete

To run an event on BSA Compete:
1. Create the event in `/admin/compete`
2. Set up divisions, brackets, athletes, judges
3. Share `bsa.surf/judge` with judges, `bsa.surf/events/[id]/live` with fans
4. LiveHeats can still run in parallel as backup

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
