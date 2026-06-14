-- Migration 001: Enable required PostgreSQL extensions
-- This must run before all other migrations

-- PostGIS for geospatial operations (nearby listings, geofencing)
CREATE EXTENSION IF NOT EXISTS postgis;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
