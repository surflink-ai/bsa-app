# BSA Official Web App — bsasurf.com

## Overview
Official web app for the Barbados Surfing Association (BSA) — the National Governing Body for all forms of surfing in Barbados. Athlete profiles, live scores, event registration with payment, rankings, and community hub.

## Data Source
**LiveHeats GraphQL API** — `https://liveheats.com/api/graphql`
- Requires `Origin: https://liveheats.com` + `Referer` headers
- BSA org ID: `223`, shortName: `BarbadosSurfingAssociation`
- Public queries: `organisationByShortName`, `event`, `series` (with proper headers)
- Auth-required: `athlete()`, `organisationAthletes()` — need LiveHeats account token
- Workaround: athlete data accessible THROUGH event queries (entries, results, competitors)

### What's Available (Public)
- ✅ All 28 events (2019–2026) with full details
- ✅ Event divisions, heats, results
- ✅ Individual ride scores with **per-judge breakdowns** and scoring ride flags
- ✅ Athlete name, nationality, image (via event/heat results)
- ✅ Rankings per event division
- ✅ Series data (SOTY 2019–2026)
- ✅ Event registration status (open/closed)
- ✅ Heat configs (counting rides, max score, priority, jerseys)
- ✅ Needs/WinBy calculations

### Auth-Required (Need LiveHeats Account)
- ❌ Direct athlete queries (profile, appearances, activity)
- ❌ Organisation athlete list with pagination
- ❌ Analytics endpoints (athleteStats, heatStats, competitorStats)

### Strategy to Get Full Data
1. **Scrape athletes from ALL events** — iterate every event's divisions/heats/entries to build complete athlete database
2. **Contact BSA/LiveHeats for API key** — they may provide org-level read access
3. **Create BSA LiveHeats account** — get auth token for full API access

## BSA Info
- **Email**: barbadossurfingassociation@gmail.com
- **Facebook**: facebook.com/bsasurf (3,142 likes)
- **Instagram**: @barbadossurfingassociation
- **Logo**: https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp
- **LiveHeats page**: https://liveheats.com/BarbadosSurfingAssociation

## Divisions
- Open Mens, Open Womens
- Under 18 Boys, Under 18 Girls
- Under 16 Boys, Under 16 Girls
- Under 14 Boys
- Under 12
- Novice
- Longboard Open
- Grand Masters (40+)
- Pro Mens, Pro Womens, Pro Juniors

## Competition Spots
- Soup Bowl (Bathsheba)
- Drill Hall
- Parlour
- South Point

## Series
- SOTY Championship (Surfer of the Year) — annual, 4-5 events
- Running since 2019 in LiveHeats (2019, 2022–2026)

## Domain
**bsasurf.com** — available ✅

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Data**: LiveHeats GraphQL (ISR/SSG for events, client-side for live)
- **Auth**: NextAuth.js (email/password + social)
- **Payments**: Stripe (event entry fees)
- **Database**: Supabase (user accounts, athlete claims, additional profiles)
- **Hosting**: Vercel
- **Real-time**: LiveHeats GraphQL subscriptions for live heats

## Features

### 1. Home Page
- Hero with next upcoming event countdown
- Live heat banner (when event is running)
- Latest results carousel
- Current SOTY standings preview
- BSA news/announcements
- Sponsor bar

### 2. Athlete Profiles (`/athletes`, `/athletes/[id]`)
- Photo, name, nationality, stance, home break, bio
- Career stats: total events, heats surfed, avg heat total, best score, best wave
- Competition history: every event, division, heat, score
- Wave score distribution chart
- Season rankings across all SOTY series
- Head-to-head comparison tool
- "Claim profile" — athletes can link their LiveHeats account to add bio/photos

### 3. Events Hub (`/events`, `/events/[id]`)
- Upcoming events with countdown + registration link
- Past event results with full brackets
- Event detail page:
  - Division tabs
  - Heat draw / bracket visualization
  - Per-heat results with wave breakdowns
  - Event stats (highest total, best wave, most waves)
  - Photo/video gallery
  - Live heat scores (during competition)

### 4. Event Registration + Payments (`/events/[id]/register`)
- Division selection (filtered by eligibility)
- Athlete profile selection or creation
- Entry fee payment via Stripe
- Confirmation email
- Registration status tracking
- Waitlist support
- **Integration**: Either deep-link to LiveHeats registration, or proxy via their API (createEntries mutation, if accessible)

### 5. Rankings (`/rankings`)
- Current SOTY Championship standings
- Historical series results
- Per-division leaderboards
- All-time records
- Trending athletes / movers

### 6. Live Scoring (`/live`)
- Real-time heat scores during events
- Priority indicator
- Wave-by-wave breakdown
- Heat timer
- Bracket progression
- Push notifications for favorite athletes

### 7. Surf Guide (`/spots`)
- Barbados surf spot profiles
- Current conditions (wave height, wind, tide)
- Best conditions guide
- Spot photos/videos
- Google Maps integration

### 8. Community / News (`/news`)
- BSA announcements
- Event recaps
- Athlete features
- Instagram feed integration
- Facebook feed

### 9. Admin Panel (`/admin`)
- Event management (create, edit, status)
- Athlete management
- Content management (news, announcements)
- Registration / payment overview
- Analytics dashboard

## Design
- Premium mobile-first PWA
- Dark/light mode
- Matching Corus brand DNA (Space Grotesk headings, DM Sans body)
- Native app feel — bottom tab bar on mobile
- Clean, minimal, editorial
- Photography-forward
- Barbados surf culture vibes

## Payment/Registration Strategy
**Option A: Direct Integration**
- Build registration form in our app
- Process payments via Stripe
- Sync entries to LiveHeats via their createEntries mutation (needs auth)
- Full control over UX

**Option B: Hybrid (Recommended for MVP)**
- Show event details + divisions in our app
- "Register Now" links to LiveHeats registration page
- LiveHeats already handles payments
- We add value through better UX, athlete profiles, stats
- Phase 2: migrate registration in-house once BSA relationship established

**Option C: White-label LiveHeats**
- LiveHeats supports custom embedding
- Embed their registration widget in our pages
- Their payment infrastructure handles everything

## Phase 1 MVP
1. Home page with upcoming event + latest results
2. All events (past + upcoming) with results
3. Athlete profiles (built from event data scrape)
4. SOTY rankings
5. Mobile-responsive PWA
6. Event registration (link to LiveHeats initially)

## Phase 2
1. Live scoring during events
2. Stripe payment integration
3. User accounts + athlete profile claiming
4. Push notifications
5. Surf spot guide with conditions
6. News/blog section

## Phase 3
1. Head-to-head comparison tool
2. Advanced analytics (AthleteIQ-style)
3. Video highlights integration
4. Social features (follow athletes, comments)
5. Sponsor management portal
