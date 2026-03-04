/**
 * Test client for BSA Priority Watch Relay
 * Simulates an Apple Watch connecting to the relay
 * 
 * Usage: node test-client.js [heat_id] [athlete_id]
 */

const WebSocket = require('ws')

const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:8080'
const heatId = process.argv[2] || 'test-heat'
const athleteId = process.argv[3] || null

const url = `${RELAY_URL}/?heat_id=${heatId}${athleteId ? `&athlete_id=${athleteId}` : ''}`
console.log(`Connecting to: ${url}`)

const ws = new WebSocket(url)

ws.on('open', () => {
  console.log('✅ Connected to relay')
})

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString())
  
  switch (msg.type) {
    case 'priority':
      console.log(`\n🏄 PRIORITY UPDATE:`)
      console.log(`   Phase: ${msg.data.phase}`)
      console.log(`   My position: P${msg.data.my_position || '—'}`)
      console.log(`   My jersey: ${msg.data.my_jersey || '—'}`)
      console.log(`   Waves: ${msg.data.my_wave_count}`)
      console.log(`   Total: ${msg.data.my_total_score}`)
      if (msg.data.my_needs_score) console.log(`   Needs: ${msg.data.my_needs_score}`)
      console.log(`   Order: ${msg.data.priority_order.map(p => `P${p.position}:${p.athlete_name}`).join(' → ')}`)
      break

    case 'timer':
      // Only log every 10 seconds to reduce noise
      if (msg.data.remaining_seconds % 10 === 0 || msg.data.warning) {
        console.log(`⏱  ${msg.data.remaining_formatted} remaining${msg.data.warning ? ' ⚠️ WARNING' : ''}${msg.data.low ? ' (under 5min)' : ''}`)
      }
      break

    case 'interference':
      console.log(`\n🚩 INTERFERENCE: ${msg.data.message}`)
      if (msg.data.is_me) console.log(`   ⚡ THIS IS YOU — penalty: ${msg.data.penalty_type}`)
      break

    case 'heat_status':
      console.log(`\n📋 HEAT STATUS: ${msg.data.status}${msg.data.priority_established ? ' (priority established)' : ''}`)
      break

    case 'haptic':
      console.log(`\n📳 HAPTIC: ${msg.data.pattern} — ${msg.data.message}`)
      break

    case 'error':
      console.log(`\n❌ ERROR: ${msg.data.message}`)
      break

    default:
      console.log(`Unknown message type: ${msg.type}`, msg.data)
  }
})

ws.on('close', () => {
  console.log('\n❌ Disconnected from relay')
})

ws.on('error', (err) => {
  console.error('Connection error:', err.message)
})

// Keep alive
process.on('SIGINT', () => {
  console.log('\nClosing...')
  ws.close()
  process.exit(0)
})
