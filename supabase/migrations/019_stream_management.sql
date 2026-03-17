-- Extend stream_config for full stream management
ALTER TABLE stream_config ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'youtube' CHECK (source_type IN ('youtube','obs','cloudflare','custom'));
ALTER TABLE stream_config ADD COLUMN IF NOT EXISTS youtube_video_id text;
ALTER TABLE stream_config ADD COLUMN IF NOT EXISTS vod_enabled boolean DEFAULT false;
ALTER TABLE stream_config ADD COLUMN IF NOT EXISTS vod_playlist jsonb DEFAULT '[]';
ALTER TABLE stream_config ADD COLUMN IF NOT EXISTS overlay_enabled boolean DEFAULT false;
ALTER TABLE stream_config ADD COLUMN IF NOT EXISTS overlay_url text;
ALTER TABLE stream_config ADD COLUMN IF NOT EXISTS scheduled_time timestamptz;
ALTER TABLE stream_config ADD COLUMN IF NOT EXISTS scheduled_title text;

-- Update RLS: admins can manage stream config (skip if exists)
DO $$ BEGIN
  CREATE POLICY "Admins can update stream config" ON stream_config FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Admins can insert stream config" ON stream_config FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','editor','event_manager'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
