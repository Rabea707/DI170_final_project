-- Calorie Tracker database schema
-- Run this against your PostgreSQL database (e.g. Neon SQL editor or psql)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  daily_goal    INTEGER      NOT NULL DEFAULT 2000,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meals (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  calories   INTEGER NOT NULL CHECK (calories > 0),
  meal_type  VARCHAR(20) NOT NULL DEFAULT 'other',
  eaten_on   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- speeds up the daily view and weekly summary queries
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals (user_id, eaten_on);