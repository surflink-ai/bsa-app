# BSA — Barbados Surfing Association

Official web app for the **Barbados Surfing Association** (the ISA member federation and National Governing Body for surfing in Barbados). Athlete profiles, event results, SOTY rankings, a live surf report, live stream, news CMS, and an admin panel.

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Data:** LiveHeats GraphQL (events/results/rankings) + Supabase (auth, CMS, athletes, comms, surf cache)
- **Hosting:** Vercel (+ optional Cloudflare Worker for the Surfline proxy)
- **Styling:** Tailwind CSS v4

> **Note:** The in-house judging system ("HeatSync") has been split into a separate project and removed from this repo. LiveHeats-sourced results and rankings remain.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

The anon Supabase key is public (it ships in the browser bundle). The
service-role key is server-only — never expose or commit it.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Local dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (Next config) |
| `npm test` | Vitest unit tests (scoring math) |
| `npm run sync:event` | Sync one LiveHeats event → Supabase (see below) |
| `npm run cache:surf` | Refresh the Surfline/WindGuru cache in Supabase |
| `npm run surf:telegram` | Send the deterministic surf report to Telegram |
| `npm run athlete:stats` | Recompute athlete competition stats |

### Syncing a LiveHeats event

`sync:event` is parameterised — no more per-event copies. It is idempotent and
recomputes cumulative season points across every synced event in the season:

```bash
LH_EVENT_ID=506069 \
EVENT_NAME="SOTY Championship Event #3 2026" \
EVENT_LOCATION="Branden's, Barbados" \
EVENT_DATE_START=2026-05-16 \
EVENT_DATE_END=2026-05-17 \
SEASON_YEAR=2026 \
npm run sync:event
```

## Environment variables

See [`.env.example`](./.env.example) for the full list with descriptions.
Groups: Supabase, site URL, LiveHeats, cron (`CRON_SECRET`), Surfline, Telegram,
Twilio, and optional Upstash rate limiting.

## Database

Migrations live in `supabase/migrations/`. Apply them with the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste each migration into the Supabase dashboard SQL editor in order.

Key security migrations:
- **021** — non-admin default role, self-escalation guard, anon-write lockdown, admin-scoped policies, safe athlete claim flow.
- **022** — drops the HeatSync judging tables.
- **023** — indexes + the `live_event` settings row.

> After deploying, **rotate the Supabase service-role key** and Surfline
> credentials if this repo's history ever contained them.

## Scheduled jobs (Vercel Cron)

`vercel.json` schedules run on Vercel (requires `CRON_SECRET`):
- `/api/cron/surf-cache` — every 30 min
- `/api/cron/surf-report?kind=dawn|morning|afternoon` — 3×/day

Cron routes reject any request without `Authorization: Bearer $CRON_SECRET`.

## Admin

- Admin panel: `/admin` (gated by `proxy.ts` + layout `requireAdmin()`).
- The current live event is set in **Admin → Settings → Live Event** (writes
  `site_settings.live_event`), consumed by the live scores API and stream.
- WhatsApp blasts are admin-only and capped by `MAX_BLAST_RECIPIENTS`.

## Testing

```bash
npm test
```

Unit tests cover the scoring math (`src/lib/scoring.ts`): best-N wave totals,
placement points, and ISA panel averaging. CI runs lint, tests, and build on
every push/PR (`.github/workflows/ci.yml`).
