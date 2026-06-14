-- Migration 007: Create ratings table

CREATE TABLE ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID NOT NULL REFERENCES reservations(id),
  rater_id        UUID NOT NULL REFERENCES users(id),
  ratee_id        UUID NOT NULL REFERENCES users(id),
  ratee_type      VARCHAR(20) NOT NULL CHECK (ratee_type IN ('business','consumer')),
  stars           SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review          TEXT,
  flag_tag        VARCHAR(50),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (reservation_id, rater_id)
);

CREATE INDEX idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX idx_ratings_reservation_id ON ratings(reservation_id);
