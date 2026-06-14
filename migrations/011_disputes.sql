-- Migration 011: Create disputes table

CREATE TABLE disputes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID NOT NULL REFERENCES reservations(id),
  raised_by       UUID NOT NULL REFERENCES users(id),
  reason          VARCHAR(50) NOT NULL
                  CHECK (reason IN ('food_quality','food_not_available','incorrect_order','other')),
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','under_review','resolved_refund','resolved_no_refund','closed')),
  resolution_note TEXT,
  resolved_by     UUID REFERENCES users(id),
  raised_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_disputes_reservation_id ON disputes(reservation_id);
CREATE INDEX idx_disputes_status ON disputes(status);
