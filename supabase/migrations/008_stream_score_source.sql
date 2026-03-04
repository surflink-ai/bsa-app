-- Add score source toggle to stream_config
alter table stream_config add column if not exists score_source text 
  check (score_source in ('liveheats', 'compete', 'off')) 
  default 'liveheats';
