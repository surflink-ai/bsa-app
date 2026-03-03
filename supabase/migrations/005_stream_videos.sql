-- VOD library for stream page (YouTube links + Cloudflare recordings)
create table if not exists stream_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  source text check (source in ('youtube', 'cloudflare')) not null default 'youtube',
  thumbnail_url text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Public read, admin write
alter table stream_videos enable row level security;
create policy "Public read stream_videos" on stream_videos for select using (true);
create policy "Admin insert stream_videos" on stream_videos for insert to authenticated with check (true);
create policy "Admin update stream_videos" on stream_videos for update to authenticated using (true);
create policy "Admin delete stream_videos" on stream_videos for delete to authenticated using (true);
