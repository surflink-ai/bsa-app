/**
 * BSA Priority Watch — WebSocket Relay Server
 * 
 * Bridges Supabase Realtime → Apple Watch clients via WebSocket.
 * Runs on Mac mini at the beach on local WiFi.
 * 
 * Usage:
 *   node server.js
 *   # or with env override:
 *   PORT=8080 node server.js
 * 
 * Watch clients connect:
 *   ws://192.168.x.x:8080/?heat_id=xxx&athlete_id=xxx
 * 
 * Admin/spectator (all athletes in heat):
 *   ws://192.168.x.x:8080/?heat_id=xxx
 * 
 * Messages pushed to clients:
 *   { type: "priority", data: { ... } }
 *   { type: "timer", data: { ... } }
 *   { type: "interference", data: { ... } }
 *   { type: "heat_status", data: { ... } }
 */

const { createClient } = require('@supabase/supabase-js')
const { WebSocketServer, WebSocket } = require('ws')
const http = require('http')
const url = require('url')

// ─── Config ───
const PORT = parseInt(process.env.PORT || '8080')
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ2dmY3VtZHZldW91bXJibGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyMzkxNSwiZXhwIjoyMDg3Njk5OTE1fQ.Uuc0omewZgBAejINDCDsrVx2Lr-ksxIF2i-kiyLRw9Y'
const TIMER_INTERVAL_MS = 1000 // push timer updates every second

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── State ───
// Track connected clients per heat
// Map<heatId, Map<clientId, { ws, athleteId?, subscribed }>>
const heatClients = new Map()
// Cache heat data to avoid re-fetching on every change
// Map<heatId, { heat, athletes, lastFetch }>
const heatCache = new Map()
// Active Supabase channels per heat
const activeChannels = new Map()
// Timer intervals per heat
const timerIntervals = new Map()
// Last broadcast hash per heat — skip if data unchanged
const lastBroadcastHash = new Map()

let clientIdCounter = 0

// ─── HTTP Server (health check + info) ───
const httpServer = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname

  // CORS for cloud deployment
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (pathname === '/' || pathname === '') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('BSA Priority Watch Relay v1.0\nWebSocket: wss://relay.bsa.surf/?heat_id=xxx&athlete_id=xxx\nHealth: /health\nHeats: /heats')
    return
  }

  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      heats: Array.from(heatClients.keys()),
      clients: Array.from(heatClients.values()).reduce((sum, m) => sum + m.size, 0),
      uptime: process.uptime(),
    }))
    return
  }

  if (pathname === '/heats') {
    // List active heats with connected clients
    const heats = []
    for (const [heatId, clients] of heatClients) {
      const cache = heatCache.get(heatId)
      heats.push({
        heat_id: heatId,
        clients: clients.size,
        athletes: cache?.athletes?.map(a => ({
          id: a.id,
          name: a.athlete_name,
          jersey: a.jersey_color,
          priority_position: a.priority_position,
          priority_status: a.priority_status,
          total_score: a.total_score,
          wave_count: a.wave_count,
        })) || [],
        priority_established: cache?.heat?.priority_established || false,
      })
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(heats))
    return
  }

  // QR code endpoint: generates connection URL for a specific athlete
  if (pathname.startsWith('/qr/')) {
    const parts = pathname.split('/')
    const heatId = parts[2]
    const athleteId = parts[3]
    const host = req.headers.host || `localhost:${PORT}`
    const wsUrl = `ws://${host}/?heat_id=${heatId}&athlete_id=${athleteId}`
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ws_url: wsUrl, heat_id: heatId, athlete_id: athleteId }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('BSA Priority Watch Relay v1.0\nConnect via WebSocket: ws://host:port/?heat_id=xxx&athlete_id=xxx')
})

// ─── WebSocket Server ───
const wss = new WebSocketServer({ server: httpServer })

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, `http://localhost:${PORT}`).searchParams
  const heatId = params.get('heat_id')
  const athleteId = params.get('athlete_id') // optional — null means spectator/admin

  if (!heatId) {
    ws.send(JSON.stringify({ type: 'error', data: { message: 'heat_id required' } }))
    ws.close()
    return
  }

  const clientId = `client_${++clientIdCounter}`
  console.log(`[+] ${clientId} connected: heat=${heatId} athlete=${athleteId || 'spectator'}`)

  // Register client
  if (!heatClients.has(heatId)) heatClients.set(heatId, new Map())
  heatClients.get(heatId).set(clientId, { ws, athleteId })

  // Subscribe to Supabase Realtime for this heat (if not already)
  ensureHeatSubscription(heatId)

  // Send initial state immediately
  sendInitialState(heatId, clientId, athleteId)

  // Start timer if not running
  ensureTimer(heatId)

  ws.on('close', () => {
    console.log(`[-] ${clientId} disconnected`)
    const clients = heatClients.get(heatId)
    if (clients) {
      clients.delete(clientId)
      if (clients.size === 0) {
        // No more clients for this heat — clean up
        cleanupHeat(heatId)
      }
    }
  })

  ws.on('error', (err) => {
    console.error(`[!] ${clientId} error:`, err.message)
  })
})

// ─── Supabase Realtime Subscription ───
function ensureHeatSubscription(heatId) {
  if (activeChannels.has(heatId)) return

  console.log(`[SUB] Subscribing to Realtime for heat ${heatId}`)

  const channel = supabase.channel(`relay-${heatId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'comp_heats',
      filter: `id=eq.${heatId}`,
    }, (payload) => {
      console.log(`[RT] comp_heats change for ${heatId}`)
      onHeatChange(heatId, payload)
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'comp_heat_athletes',
      filter: `heat_id=eq.${heatId}`,
    }, (payload) => {
      console.log(`[RT] comp_heat_athletes change for ${heatId}`)
      onAthleteChange(heatId, payload)
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'comp_interference',
      filter: `heat_id=eq.${heatId}`,
    }, (payload) => {
      console.log(`[RT] comp_interference INSERT for ${heatId}`)
      onInterference(heatId, payload)
    })
    .subscribe((status) => {
      console.log(`[SUB] Channel status for ${heatId}: ${status}`)
    })

  activeChannels.set(heatId, channel)
}

// ─── Fetch & Cache Heat Data ───
async function fetchHeatData(heatId) {
  const [heatRes, athleteRes] = await Promise.all([
    supabase
      .from('comp_heats')
      .select('id, status, heat_number, duration_minutes, actual_start, is_paused, priority_order, priority_established, priority_riders, time_remaining_seconds, certified')
      .eq('id', heatId)
      .single(),
    supabase
      .from('comp_heat_athletes')
      .select('id, athlete_name, jersey_color, wave_count, total_score, needs_score, has_priority, priority_status, priority_position, penalty, is_disqualified, result_position')
      .eq('heat_id', heatId)
      .order('seed_position'),
  ])

  const data = {
    heat: heatRes.data,
    athletes: athleteRes.data || [],
    lastFetch: Date.now(),
  }

  heatCache.set(heatId, data)
  return data
}

// ─── Send Initial State ───
async function sendInitialState(heatId, clientId, athleteId) {
  const data = await fetchHeatData(heatId)
  if (!data.heat) return

  const client = heatClients.get(heatId)?.get(clientId)
  if (!client || client.ws.readyState !== WebSocket.OPEN) return

  // Build priority state
  const priorityMsg = buildPriorityMessage(data, athleteId)
  client.ws.send(JSON.stringify(priorityMsg))

  // Send timer
  const timerMsg = buildTimerMessage(data)
  client.ws.send(JSON.stringify(timerMsg))

  // Send heat status
  client.ws.send(JSON.stringify({
    type: 'heat_status',
    data: {
      status: data.heat.status,
      heat_number: data.heat.heat_number,
      certified: data.heat.certified,
      priority_established: data.heat.priority_established,
    },
  }))
}

// ─── Build Messages ───
function buildPriorityMessage(data, athleteId) {
  const { heat, athletes } = data
  const order = heat.priority_order || []

  // Find this athlete's data
  const me = athleteId ? athletes.find(a => a.id === athleteId) : null
  const myPosition = athleteId ? order.indexOf(athleteId) + 1 : 0 // 0 = not in order

  // Build full priority list with jersey colors
  const priorityList = order.map((id, i) => {
    const a = athletes.find(a => a.id === id)
    return {
      position: i + 1,
      athlete_id: id,
      athlete_name: a?.athlete_name || 'Unknown',
      jersey_color: a?.jersey_color || null,
      priority_status: a?.priority_status || 'none',
      is_me: id === athleteId,
    }
  })

  return {
    type: 'priority',
    data: {
      phase: heat.priority_established ? 'established' : 'establishing',
      my_position: myPosition, // 0 = no priority yet, 1 = P1, etc.
      my_priority_status: me?.priority_status || 'none',
      my_jersey: me?.jersey_color || null,
      my_wave_count: me?.wave_count || 0,
      my_total_score: me?.total_score || 0,
      my_needs_score: me?.needs_score || null,
      my_result_position: me?.result_position || null,
      my_penalty: me?.penalty || null,
      my_is_disqualified: me?.is_disqualified || false,
      priority_order: priorityList,
      riders_count: (heat.priority_riders || []).length,
      riders_needed: athletes.length - 1,
      athlete_count: athletes.length,
    },
  }
}

function buildTimerMessage(data) {
  const { heat } = data
  let remainingSeconds = heat.time_remaining_seconds

  // Calculate remaining time if heat is live and not paused
  if (heat.status === 'live' && heat.actual_start && !heat.is_paused) {
    const elapsed = (Date.now() - new Date(heat.actual_start).getTime()) / 1000
    const totalSeconds = (heat.duration_minutes || 20) * 60
    remainingSeconds = Math.max(0, Math.round(totalSeconds - elapsed))
  }

  return {
    type: 'timer',
    data: {
      remaining_seconds: remainingSeconds || 0,
      remaining_formatted: formatTime(remainingSeconds || 0),
      duration_minutes: heat.duration_minutes || 20,
      is_paused: heat.is_paused || false,
      status: heat.status,
      warning: remainingSeconds <= 30, // 30-sec warning
      low: remainingSeconds <= 300 && remainingSeconds > 30, // under 5 min
    },
  }
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ─── Broadcast to Heat Clients ───
function broadcastToHeat(heatId, messageFn) {
  const clients = heatClients.get(heatId)
  if (!clients) return

  const data = heatCache.get(heatId)
  if (!data) return

  for (const [clientId, client] of clients) {
    if (client.ws.readyState !== WebSocket.OPEN) continue
    try {
      const msg = typeof messageFn === 'function' ? messageFn(client.athleteId) : messageFn
      client.ws.send(JSON.stringify(msg))
    } catch (err) {
      console.error(`[!] Failed to send to ${clientId}:`, err.message)
    }
  }
}

// ─── Realtime Event Handlers ───
async function onHeatChange(heatId, payload) {
  // Refresh cache
  const data = await fetchHeatData(heatId)
  if (!data.heat) return

  // Broadcast priority update to all clients
  broadcastToHeat(heatId, (athleteId) => buildPriorityMessage(data, athleteId))

  // Broadcast heat status
  broadcastToHeat(heatId, {
    type: 'heat_status',
    data: {
      status: data.heat.status,
      heat_number: data.heat.heat_number,
      certified: data.heat.certified,
      priority_established: data.heat.priority_established,
    },
  })
}

async function onAthleteChange(heatId, payload) {
  const data = await fetchHeatData(heatId)
  if (!data.heat) return

  // Deduplicate: hash the scoring-relevant fields. Skip if unchanged.
  const hash = data.athletes.map(a => `${a.id}:${a.total_score}:${a.needs_score}:${a.wave_count}:${a.priority_position}:${a.penalty}:${a.is_disqualified}:${a.result_position}`).join('|')
  if (lastBroadcastHash.get(heatId) === hash) return
  lastBroadcastHash.set(heatId, hash)

  console.log(`[DEDUP] Broadcasting update for heat ${heatId}`)
  broadcastToHeat(heatId, (athleteId) => buildPriorityMessage(data, athleteId))
}

function onInterference(heatId, payload) {
  const record = payload.new
  if (!record) return

  // Broadcast interference alert
  broadcastToHeat(heatId, (athleteId) => {
    const isMe = record.athlete_id === athleteId
    return {
      type: 'interference',
      data: {
        athlete_id: record.athlete_id,
        wave_number: record.wave_number,
        penalty_type: record.penalty_type,
        is_me: isMe,
        message: isMe
          ? `INTERFERENCE — ${record.penalty_type === 'double_interference' ? 'DISQUALIFIED' : '2nd best wave halved'}`
          : `Interference called on opponent`,
      },
    }
  })
}

// ─── Timer Tick ───
function ensureTimer(heatId) {
  if (timerIntervals.has(heatId)) return

  const interval = setInterval(() => {
    const data = heatCache.get(heatId)
    if (!data?.heat || data.heat.status !== 'live') return

    const timerMsg = buildTimerMessage(data)

    // Broadcast timer to all clients
    broadcastToHeat(heatId, timerMsg)

    // Send haptic trigger at 30 seconds remaining
    if (timerMsg.data.remaining_seconds === 30) {
      broadcastToHeat(heatId, {
        type: 'haptic',
        data: { pattern: 'heat_ending', message: '30 seconds remaining!' },
      })
    }

    // Heat ended
    if (timerMsg.data.remaining_seconds <= 0) {
      broadcastToHeat(heatId, {
        type: 'heat_status',
        data: { status: 'complete', message: 'Heat finished!' },
      })
    }
  }, TIMER_INTERVAL_MS)

  timerIntervals.set(heatId, interval)
}

// ─── Cleanup ───
function cleanupHeat(heatId) {
  console.log(`[CLEANUP] No clients left for heat ${heatId}`)

  // Remove Supabase channel
  const channel = activeChannels.get(heatId)
  if (channel) {
    supabase.removeChannel(channel)
    activeChannels.delete(heatId)
  }

  // Clear timer
  const timer = timerIntervals.get(heatId)
  if (timer) {
    clearInterval(timer)
    timerIntervals.delete(heatId)
  }

  // Clear dedup hash
  lastBroadcastHash.delete(heatId)

  // Clear cache
  heatCache.delete(heatId)
  heatClients.delete(heatId)
}

// ─── Start ───
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════╗
║   BSA Priority Watch Relay v1.0          ║
║                                          ║
║   WebSocket: ws://0.0.0.0:${PORT}          ║
║   Health:    http://0.0.0.0:${PORT}/health  ║
║   Heats:     http://0.0.0.0:${PORT}/heats   ║
║                                          ║
║   Connect watches:                       ║
║   ws://IP:${PORT}/?heat_id=x&athlete_id=y   ║
╚══════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Closing all connections...')
  for (const [heatId] of heatClients) {
    cleanupHeat(heatId)
  }
  wss.close()
  httpServer.close()
  process.exit(0)
})
