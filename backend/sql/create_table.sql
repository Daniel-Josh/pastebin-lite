-- backend/sql/create_table.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS pastes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT,          -- milliseconds since epoch; NULL => never
  remaining_views INTEGER     -- NULL => unlimited
);
