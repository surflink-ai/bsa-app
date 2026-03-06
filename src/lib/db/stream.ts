// Stream config now lives in HeatSync — this stub checks HeatSync's stream status
export interface StreamConfig {
  id: string
  active: boolean
  stream_url: string | null
  embed_code: string | null
  title: string | null
  event_id: string | null
  updated_at: string
  updated_by: string | null
  score_source?: string
}

export async function getStreamConfig(): Promise<StreamConfig | null> {
  try {
    // Check HeatSync stream status
    const res = await fetch('https://heatsync.ai/api/stream/status', { next: { revalidate: 10 } })
    const data = await res.json()
    return {
      id: 'heatsync',
      active: data.live || false,
      stream_url: null,
      embed_code: null,
      title: null,
      event_id: null,
      updated_at: new Date().toISOString(),
      updated_by: null,
    }
  } catch {
    return null
  }
}
