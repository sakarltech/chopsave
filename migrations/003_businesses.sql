-- Migration 003: Create businesses table with PostGIS geom column and auto-update trigger

CREATE TABLE businesses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  type              VARCHAR(50) NOT NULL
                    CHECK (type IN ('restaurant','bakery','buka','canteen','food_stall','supermarket','cloud_kitchen')),
  description       TEXT,
  address           TEXT NOT NULL,
  city              VARCHAR(20) NOT NULL CHECK (city IN ('lagos','abuja')),
  lat               DECIMAL(10,7) NOT NULL,
  lng               DECIMAL(10,7) NOT NULL,
  geom              GEOMETRY(Point, 4326),
  verification_tier VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (verification_tier IN ('pending','verified_informal','verified_cac','rejected')),
  cac_number        VARCHAR(20),
  photo_urls        TEXT[] NOT NULL DEFAULT '{}',
  commission_rate   DECIMAL(4,2) NOT NULL DEFAULT 18.00,
  avg_rating        DECIMAL(3,2) DEFAULT 0.00,
  total_ratings     INTEGER NOT NULL DEFAULT 0,
  food_saved_kg     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  co2_saved_kg      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payout_balance    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_businesses_geom ON businesses USING GIST(geom);
CREATE INDEX idx_businesses_city ON businesses(city);
CREATE INDEX idx_businesses_verification ON businesses(verification_tier);

-- Trigger to auto-populate geom column from lat/lng
CREATE OR REPLACE FUNCTION update_business_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_business_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_business_geom();
