-- Migration 005: Create reservations and reservation_items tables

CREATE TABLE reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id     UUID NOT NULL REFERENCES users(id),
  listing_id      UUID NOT NULL REFERENCES listings(id),
  business_id     UUID NOT NULL REFERENCES businesses(id),
  quantity        INTEGER NOT NULL DEFAULT 1,
  amount_paid     DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(4,2) NOT NULL,
  commission_amt  DECIMAL(10,2) NOT NULL,
  payout_amt      DECIMAL(10,2) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending_payment'
                  CHECK (status IN (
                    'pending_payment','confirmed','ready','completed',
                    'no_show','cancelled','refunded','disputed'
                  )),
  pickup_code     VARCHAR(8) NOT NULL UNIQUE,
  collected_at    TIMESTAMPTZ,
  no_show_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT payout_commission_sum CHECK (
    ABS((payout_amt + commission_amt) - amount_paid) < 0.01
  )
);

CREATE INDEX idx_reservations_consumer_id ON reservations(consumer_id);
CREATE INDEX idx_reservations_listing_id ON reservations(listing_id);
CREATE INDEX idx_reservations_business_id ON reservations(business_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_pickup_code ON reservations(pickup_code);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);

CREATE TABLE reservation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  listing_item_id UUID NOT NULL REFERENCES listing_items(id),
  quantity        INTEGER NOT NULL,
  unit_price      DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_res_items_reservation_id ON reservation_items(reservation_id);
