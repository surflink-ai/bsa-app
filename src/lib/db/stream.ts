// Stream config stub — returns null (no active stream)
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
  return null
}
