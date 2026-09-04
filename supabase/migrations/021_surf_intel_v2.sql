-- Surf Intel v2: NOAA buoys, Open-Meteo, NHC storms, forecast bias, swell alerts
-- Created: 2026-09-04

-- NOAA buoy readings (48h history, 30-min intervals)
CREATE TABLE IF NOT EXISTS buoy_readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buoy_id text NOT NULL,
  timestamp timestamptz NOT NULL,
  wvht_m float,        -- significant wave height (m)
  dpd_s float,         -- dominant period (s)
  apd_s float,         -- average period (s)
  mwd_deg int,         -- mean wave direction (degrees)
  wspd_kt float,       -- wind speed (kt, converted from m/s)
  wdir_deg int,        -- wind direction (degrees)
  trend text CHECK (trend IN ('rising', 'steady', 'falling')),
  change_6h_m float,   -- delta WVHT over last 6 hours (m)
  primary_swell_json jsonb,   -- {height_m, period_s, dir_compass}
  secondary_swell_json jsonb, -- wind wave component
  raw_json jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (buoy_id, timestamp)
);
CREATE INDEX IF NOT EXISTS buoy_readings_buoy_ts ON buoy_readings (buoy_id, timestamp DESC);

-- Open-Meteo Marine ECMWF 7-day hourly forecast
CREATE TABLE IF NOT EXISTS openmeteo_forecasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coast text NOT NULL,          -- 'east' | 'south'
  timestamp timestamptz NOT NULL,
  wave_height_m float,
  wave_period_s float,
  wave_dir_deg int,
  swell_height_m float,
  swell_period_s float,
  swell_dir_deg int,
  wind_wave_height_m float,
  wind_wave_period_s float,
  created_at timestamptz DEFAULT now(),
  UNIQUE (coast, timestamp)
);
CREATE INDEX IF NOT EXISTS openmeteo_coast_ts ON openmeteo_forecasts (coast, timestamp);

-- NHC active storm snapshots
CREATE TABLE IF NOT EXISTS nhc_storms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  storm_id text NOT NULL,
  name text,
  classification text,          -- HU, TS, TD
  category int,                 -- Saffir-Simpson (0=TS/TD)
  lat float,
  lon float,
  max_winds_kt int,
  movement_speed_kt float,
  movement_dir_deg int,
  distance_nm int,              -- from Barbados (13.1°N, 59.5°W)
  bearing_deg int,              -- bearing FROM storm TO Barbados
  est_swell_period_s float,     -- projected dominant swell period (s)
  est_eta_hours float,          -- estimated swell ETA to Barbados
  raw_json jsonb,
  fetched_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nhc_storms_id_fetched ON nhc_storms (storm_id, fetched_at DESC);

-- Surfline vs buoy forecast accuracy tracking
CREATE TABLE IF NOT EXISTS forecast_bias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,          -- 'surfline', 'openmeteo', 'windguru'
  coast text NOT NULL,           -- 'east', 'south'
  forecast_date date NOT NULL,
  predicted_height_ft float,
  actual_height_ft float,
  error_ft float,                -- predicted - actual (positive = ran hot)
  created_at timestamptz DEFAULT now(),
  UNIQUE (source, coast, forecast_date)
);

-- Swell alert deduplication
CREATE TABLE IF NOT EXISTS swell_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  swell_id text NOT NULL UNIQUE,  -- deterministic key for dedup
  alert_type text,                -- 'buoy_long_period', 'surfline_jump', 'nhc_storm'
  fired_at timestamptz DEFAULT now(),
  data_json jsonb
);
