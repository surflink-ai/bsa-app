-- ============================================================
-- 022 · Remove the in-house judging (HeatSync) tables
--
-- HeatSync is being rebuilt as a separate project. These tables held the
-- multi-judge scoring system (including plaintext, world-readable judge PINs)
-- and are NOT part of the LiveHeats-sourced data.
--
-- KEPT (all LiveHeats-sourced): comp_events, comp_event_divisions,
-- comp_rounds, comp_heats, comp_heat_athletes, comp_wave_scores,
-- comp_season_points, comp_divisions, comp_seasons, athletes.
--
-- CASCADE also drops the foreign-key references from comp_heats
-- (certified_by) and removes these tables from the realtime publication.
-- Extra HeatSync-only columns on the kept tables are left in place; they are
-- unused and harmless, and dropping them adds needless risk to live data.
-- ============================================================

drop table if exists comp_score_overrides cascade;
drop table if exists comp_interference cascade;
drop table if exists comp_heat_judges cascade;
drop table if exists comp_judge_scores cascade;
drop table if exists comp_judges cascade;
