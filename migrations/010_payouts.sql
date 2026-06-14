-- Migration 010: Create payouts table

CREATE TABLE payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id),
  amount          DECIMAL(10,2) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','completed','failed')),
  bank_account    JSONB NOT NULL,
  gateway         VARCHAR(20) NOT NULL CHECK (gateway IN ('paystack','flutterwave')),
  gateway_ref     VARCHAR(100),
  failure_reason  TEXT,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_payouts_business_id ON payouts(business_id);
CREATE INDEX idx_payouts_status ON payouts(status);
