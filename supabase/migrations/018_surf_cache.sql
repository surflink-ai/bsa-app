-- Surf data cache — populated by local cron, read by Vercel API
CREATE TABLE IF NOT EXISTS surf_cache (
  key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Allow anonymous reads
ALTER TABLE surf_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surf_cache_read" ON surf_cache FOR SELECT USING (true);
