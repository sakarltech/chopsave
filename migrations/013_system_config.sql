-- Migration 013: Create system_config table and seed defaults

CREATE TABLE system_config (
  key             VARCHAR(100) PRIMARY KEY,
  value           TEXT NOT NULL,
  description     TEXT,
  updated_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default configuration values
INSERT INTO system_config(key, value, description) VALUES
  ('default_commission_rate', '18', 'Default platform commission % per transaction'),
  ('food_weight_default_kg', '0.5', 'Default food weight in kg per listing unit'),
  ('co2_per_kg_food', '2.5', 'kg CO2 equivalent per kg of food saved'),
  ('no_show_suspension_days', '7', 'Days buyer is suspended after 3 no-shows in 30 days'),
  ('payout_min_ngn', '500', 'Minimum NGN for payout settlement'),
  ('pickup_reminder_60min', 'true', 'Send reminder 60min before pickup window'),
  ('pickup_reminder_30min', 'true', 'Send reminder 30min before pickup window closes');
