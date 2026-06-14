-- Migration 006: Create payments table

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID NOT NULL REFERENCES reservations(id),
  gateway         VARCHAR(20) NOT NULL CHECK (gateway IN ('paystack','flutterwave')),
  method          VARCHAR(20) NOT NULL CHECK (method IN ('card','bank_transfer','ussd','opay','wallet')),
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'NGN',
  status          VARCHAR(20) NOT NULL DEFAULT 'initiated'
                  CHECK (status IN ('initiated','pending','successful','failed','refunded')),
  gateway_ref     VARCHAR(100) UNIQUE,
  gateway_meta    JSONB,
  initiated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ,
  refunded_at     TIMESTAMPTZ,
  refund_ref      VARCHAR(100)
);

CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payments_gateway_ref ON payments(gateway_ref);
CREATE INDEX idx_payments_status ON payments(status);
