-- Migration 008: Create favourites table

CREATE TABLE favourites (
  consumer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (consumer_id, business_id)
);

CREATE INDEX idx_favourites_business_id ON favourites(business_id);
