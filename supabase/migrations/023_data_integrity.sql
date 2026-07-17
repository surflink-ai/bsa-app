-- ============================================================
-- 023 · Data integrity & performance indexes
--
-- Adds indexes on commonly-filtered foreign keys / columns that were missing,
-- plus a settings row for the current live event so it no longer has to be
-- hardcoded in application code. All statements are idempotent.
-- ============================================================

-- Foreign keys / hot filter columns
create index if not exists idx_comp_events_season on comp_events(season_id);
create index if not exists idx_comp_event_divisions_event on comp_event_divisions(event_id);
create index if not exists idx_comp_event_divisions_division on comp_event_divisions(division_id);
create index if not exists idx_comp_rounds_event_division on comp_rounds(event_division_id);
create index if not exists idx_comp_heats_round on comp_heats(round_id);
create index if not exists idx_comp_season_points_season_div on comp_season_points(season_id, division_id);
create index if not exists idx_articles_category on articles(category);
create index if not exists idx_articles_author on articles(author_id);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_notifications_sent_at on notifications(sent_at desc);
create index if not exists idx_stream_videos_active on stream_videos(active, sort_order);

-- Live-event pointer, read by the site + stream instead of a hardcoded ID.
-- value shape: { "liveheats_event_id": "506069", "label": "SOTY Event #3" }
insert into site_settings (key, value)
values ('live_event', '{"liveheats_event_id": null, "label": null}'::jsonb)
on conflict (key) do nothing;
