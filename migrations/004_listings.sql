-- Migration 004: Create listings and listing_items tables

CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('surprise_bag', 'itemised')),
  title           VARCHAR(255),
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','paused','sold_out','expired','closed')),
  original_price  DECIMAL(10,2),
  discount_price  DECIMAL(10,2) NOT NULL,
  quantity_total  INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  pickup_start    TIMESTAMPTZ NOT NULL,
  pickup_end      TIMESTAMPTZ NOT NULL,
  food_categories TEXT[] NOT NULL DEFAULT '{}',
  dietary_tags    TEXT[] NOT NULL DEFAULT '{}',
  photo_url       TEXT,
  weight_kg       DECIMAL(5,2) DEFAULT 0.50,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT listing_pickup_window CHECK (pickup_end > pickup_start),
  CONSTRAINT listing_pickup_same_day CHECK (
    DATE(pickup_start AT TIME ZONE 'Africa/Lagos') = DATE(pickup_end AT TIME ZONE 'Africa/Lagos')
  ),
  CONSTRAINT listing_quantity CHECK (quantity_remaining >= 0 AND quantity_remaining <= quantity_total),
  CONSTRAINT listing_price_positive CHECK (discount_price > 0)
);

CREATE INDEX idx_listings_business_id ON listings(business_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_pickup_end ON listings(pickup_end);
CREATE INDEX idx_listings_type ON listings(type);

-- Listing items for itemised listings
CREATE TABLE listing_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     VARCHAR(200),
  original_price  DECIMAL(10,2),
  discount_price  DECIMAL(10,2) NOT NULL,
  quantity_total  INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  dietary_tags    TEXT[] DEFAULT '{}',
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT item_price_positive CHECK (discount_price > 0),
  CONSTRAINT item_quantity CHECK (quantity_remaining >= 0 AND quantity_remaining <= quantity_total)
);

CREATE INDEX idx_listing_items_listing_id ON listing_items(listing_id);
