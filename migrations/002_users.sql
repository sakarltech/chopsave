-- Migration 002: Create users table

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(15) UNIQUE,
  email           VARCHAR(255) UNIQUE,
  full_name       VARCHAR(255) NOT NULL,
  display_name    VARCHAR(100),
  avatar_url      TEXT,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('consumer', 'business_owner', 'admin')),
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended', 'deleted')),
  dietary_prefs   TEXT[] NOT NULL DEFAULT '{}',
  fcm_token       TEXT,
  notif_prefs     JSONB NOT NULL DEFAULT '{}',
  no_show_count   INTEGER NOT NULL DEFAULT 0,
  no_show_window_start DATE,
  suspended_until TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
