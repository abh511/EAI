-- ╔══════════════════════════════════════════════════════════════════╗
-- ║   EnviroWatch AI  —  Supabase Database Schema                   ║
-- ║   Run this in: Supabase Dashboard → SQL Editor → Run            ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";   -- for geo queries (optional)

-- ── Cities & Locations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL UNIQUE,
    state       TEXT NOT NULL DEFAULT 'Maharashtra',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id     UUID REFERENCES cities(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    zone_type   TEXT,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    is_coastal  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city_id, name)
);

-- ── Environmental Readings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS env_readings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id     UUID REFERENCES locations(id) ON DELETE CASCADE,
    recorded_at     TIMESTAMPTZ NOT NULL,

    -- Air Quality
    pm2_5           NUMERIC(8,2),
    pm10            NUMERIC(8,2),
    no2             NUMERIC(8,2),
    so2             NUMERIC(8,2),
    co              NUMERIC(8,2),
    o3              NUMERIC(8,2),
    aqi_us          INTEGER,
    aqi_category    TEXT,

    -- Water Quality
    water_ph        NUMERIC(5,2),
    water_tds       NUMERIC(8,2),
    water_bod       NUMERIC(8,2),
    water_do        NUMERIC(8,2),
    water_turbidity NUMERIC(8,2),
    water_coliform  NUMERIC(8,2),
    water_wqi       NUMERIC(5,1),

    -- Noise
    noise_day_dba   NUMERIC(5,1),
    noise_night_dba NUMERIC(5,1),

    -- Groundwater
    gw_depth_m      NUMERIC(6,1),
    gw_tds          NUMERIC(8,2),
    gw_ph           NUMERIC(5,2),
    gw_nitrate      NUMERIC(8,2),
    gw_fluoride     NUMERIC(6,3),

    -- Urban Heat
    ambient_temp    NUMERIC(5,1),
    uhi_intensity   NUMERIC(5,2),
    green_cover_pct NUMERIC(5,1),

    -- Emissions
    nox             NUMERIC(8,2),
    sox             NUMERIC(8,2),
    spm             NUMERIC(8,2),

    -- Waste
    waste_gen       NUMERIC(10,1),
    recycling_pct   NUMERIC(5,1),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Alerts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id     UUID REFERENCES locations(id) ON DELETE CASCADE,
    pillar          TEXT NOT NULL,     -- air, water, noise, industrial, waste, heat, groundwater
    severity        TEXT NOT NULL,     -- low, medium, high, critical
    parameter       TEXT NOT NULL,     -- e.g. pm2_5, water_bod
    observed_value  NUMERIC(10,2),
    threshold_value NUMERIC(10,2),
    message         TEXT NOT NULL,
    authority       TEXT,              -- MPCB, PMC, CPCB, NMMC
    status          TEXT DEFAULT 'open',  -- open, in_progress, resolved
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Forecasts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forecasts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id     UUID REFERENCES locations(id) ON DELETE CASCADE,
    pillar          TEXT NOT NULL,
    parameter       TEXT NOT NULL,
    forecast_for    TIMESTAMPTZ NOT NULL,
    predicted_value NUMERIC(10,2),
    confidence      NUMERIC(5,3),
    will_breach     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Grievances ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grievances (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID,
    location_id UUID REFERENCES locations(id),
    pillar      TEXT,
    description TEXT NOT NULL,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    photo_url   TEXT,
    status      TEXT DEFAULT 'submitted',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Users (extends Supabase auth.users) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT,
    role        TEXT DEFAULT 'citizen',  -- citizen, authority, admin
    city_id     UUID REFERENCES cities(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Seed cities & locations ──────────────────────────────────────────────────
INSERT INTO cities (name) VALUES ('Pune'), ('Mumbai')
ON CONFLICT (name) DO NOTHING;

-- Pune locations
WITH pune AS (SELECT id FROM cities WHERE name = 'Pune')
INSERT INTO locations (city_id, name, zone_type, latitude, longitude)
SELECT pune.id, loc.name, loc.zone, loc.lat, loc.lon FROM pune,
(VALUES
  ('Viman Nagar',     'Residential-IT',       18.5679, 73.9143),
  ('Koregaon Park',   'Upscale Residential',  18.5362, 73.8942),
  ('Hadapsar',        'Industrial-Residential',18.5018,73.9260),
  ('Kothrud',         'Dense Residential',    18.5074, 73.8077),
  ('Pimpri-Chinchwad','Heavy Industrial',     18.6279, 73.7997),
  ('Hinjewadi',       'IT Park',              18.5904, 73.7285),
  ('Shivaji Nagar',   'Central Commercial',   18.5308, 73.8475),
  ('Baner',           'Residential Suburb',   18.5590, 73.7868),
  ('Yerawada',        'Mixed Urban',          18.5504, 73.8938),
  ('Magarpatta City', 'Gated IT Township',    18.5148, 73.9310)
) AS loc(name, zone, lat, lon)
ON CONFLICT (city_id, name) DO NOTHING;

-- Mumbai locations
WITH mumbai AS (SELECT id FROM cities WHERE name = 'Mumbai')
INSERT INTO locations (city_id, name, zone_type, latitude, longitude, is_coastal)
SELECT mumbai.id, loc.name, loc.zone, loc.lat, loc.lon, loc.coastal FROM mumbai,
(VALUES
  ('Bandra West',  'Upscale Coastal Residential', 19.0596, 72.8295, TRUE),
  ('Dharavi',      'High-Density Slum-Industrial', 19.0437, 72.8543, FALSE),
  ('Andheri East', 'Commercial-Industrial',        19.1136, 72.8697, FALSE),
  ('Worli',        'Mixed Commercial-Residential', 19.0176, 72.8178, TRUE),
  ('Chembur',      'Industrial',                   19.0619, 72.9004, FALSE),
  ('Powai',        'IT-Residential (Lakeside)',     19.1197, 72.9053, FALSE),
  ('Colaba',       'Historic Coastal Commercial',  18.9067, 72.8147, TRUE),
  ('Kurla',        'High-Density Mixed',           19.0726, 72.8794, FALSE),
  ('Malad West',   'Suburban Residential',         19.1863, 72.8481, TRUE),
  ('Malabar Hill', 'Elite Residential-Green Zone', 18.9548, 72.7965, TRUE)
) AS loc(name, zone, lat, lon, coastal)
ON CONFLICT (city_id, name) DO NOTHING;

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE env_readings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;

-- Public read for env_readings, alerts, forecasts (no login needed to view data)
CREATE POLICY "Public read env_readings"  ON env_readings  FOR SELECT USING (TRUE);
CREATE POLICY "Public read alerts"        ON alerts        FOR SELECT USING (TRUE);
CREATE POLICY "Public read forecasts"     ON forecasts     FOR SELECT USING (TRUE);

-- Grievance: user can only see own rows
CREATE POLICY "Own grievances only" ON grievances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Insert own grievance" ON grievances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User profiles: own row only
CREATE POLICY "Own profile only" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_readings_location   ON env_readings(location_id);
CREATE INDEX IF NOT EXISTS idx_readings_time       ON env_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status       ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_location     ON alerts(location_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_location  ON forecasts(location_id, forecast_for);

SELECT 'Schema created successfully ✅' AS result;
