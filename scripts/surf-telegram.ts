#!/usr/bin/env tsx
/**
 * CLI: send the deterministic Barbados surf report to Telegram.
 *   KIND=morning|afternoon|dawn DRY_RUN=1 npm run surf:telegram
 *
 * Logic lives in src/lib/surf-report.ts and is shared with the Vercel Cron
 * route (/api/cron/surf-report), which is the recommended scheduler.
 *
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, optional CONDITIONS_URL.
 */
import './_supabase' // loads .env.local into process.env
import { sendSurfReport, type ReportKind } from '../src/lib/surf-report'

const kind = (process.env.KIND || 'morning') as ReportKind
const dryRun = process.env.DRY_RUN === '1'

sendSurfReport({ kind, dryRun })
  .then((r) => {
    console.log(`Sent ${r.kind} report (${r.length} chars)`)
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
