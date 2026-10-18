-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Migration 001: store every dataset column in env_readings       ║
-- ║  Additive only: no columns or rows are dropped.                  ║
-- ║  Run: python backend/scripts/migrate_and_seed.py                 ║
-- ║  (or paste into Supabase Dashboard → SQL Editor)                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

ALTER TABLE env_readings
    -- Position of this reading (stations report small GPS variations)
    ADD COLUMN IF NOT EXISTS latitude            DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude           DOUBLE PRECISION,

    -- Water
    ADD COLUMN IF NOT EXISTS water_cod           NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS water_hardness      NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS water_chloride      NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS water_nitrate       NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS water_grade         TEXT,

    -- Noise
    ADD COLUMN IF NOT EXISTS noise_peak_dba      NUMERIC(5,1),
    ADD COLUMN IF NOT EXISTS noise_zone          TEXT,
    ADD COLUMN IF NOT EXISTS noise_compliance    TEXT,

    -- Emissions
    ADD COLUMN IF NOT EXISTS industrial_activity TEXT,
    ADD COLUMN IF NOT EXISTS rspm                NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS voc                 NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS stack_temp          NUMERIC(6,1),
    ADD COLUMN IF NOT EXISTS emission_category   TEXT,

    -- Waste
    ADD COLUMN IF NOT EXISTS landfill_pct        NUMERIC(5,1),
    ADD COLUMN IF NOT EXISTS compost_pct         NUMERIC(5,1),
    ADD COLUMN IF NOT EXISTS waste_per_capita_kg NUMERIC(8,4),
    ADD COLUMN IF NOT EXISTS litter_index        NUMERIC(5,1),

    -- Urban heat
    ADD COLUMN IF NOT EXISTS surface_temp        NUMERIC(5,1),
    ADD COLUMN IF NOT EXISTS lst_anomaly         NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS humidity_pct        NUMERIC(5,1),
    ADD COLUMN IF NOT EXISTS heat_index          NUMERIC(5,1),

    -- Groundwater
    ADD COLUMN IF NOT EXISTS gw_ec               NUMERIC(8,1),
    ADD COLUMN IF NOT EXISTS gw_hardness         NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS gw_iron             NUMERIC(8,4),
    ADD COLUMN IF NOT EXISTS gw_arsenic          NUMERIC(8,4),
    ADD COLUMN IF NOT EXISTS gw_chloride         NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS gw_suitability      TEXT,

    -- Weather & context
    ADD COLUMN IF NOT EXISTS wind_speed_kmh      NUMERIC(6,1),
    ADD COLUMN IF NOT EXISTS rainfall_mm         NUMERIC(7,1),
    ADD COLUMN IF NOT EXISTS traffic_density     NUMERIC(5,1),
    ADD COLUMN IF NOT EXISTS industrial_proximity_km NUMERIC(6,2);

-- Readings are queried per location in time order
CREATE INDEX IF NOT EXISTS idx_readings_location_time ON env_readings(location_id, recorded_at);

-- Grievances get a human-friendly tracking ID (GRV-2026-XXXXXX)
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS tracking_id TEXT UNIQUE;

-- Align zone names with the dataset the models were trained on
UPDATE locations SET zone_type = 'Residential-IT Suburb'           WHERE name = 'Baner';
UPDATE locations SET zone_type = 'Upscale Residential-Commercial'  WHERE name = 'Koregaon Park';
UPDATE locations SET zone_type = 'Suburban Residential-Commercial' WHERE name = 'Malad West';
