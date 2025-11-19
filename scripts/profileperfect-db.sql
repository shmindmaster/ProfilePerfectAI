-- ProfilePerfectAI schema for profileperfect_db on pg-shared-apps-eastus2

-- Enable UUIDs (if not already enabled on this DB)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users (simple user table if you are not using NextAuth yet)
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. credits (per-user credit balance)
CREATE TABLE IF NOT EXISTS credits (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id),
  credits    INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. generation_jobs (headshot generation jobs)
CREATE TABLE IF NOT EXISTS generation_jobs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  name              TEXT,
  type              TEXT,
  status            TEXT NOT NULL CHECK (status IN ('processing','completed','failed')) DEFAULT 'processing',
  model_id          TEXT,
  style_preset      TEXT,
  background_preset TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. uploaded_photos (reference images per job)
CREATE TABLE IF NOT EXISTS uploaded_photos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id   UUID NOT NULL REFERENCES generation_jobs(id),
  uri        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. images (generated/retouched images)
CREATE TABLE IF NOT EXISTS images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  model_id    UUID REFERENCES generation_jobs(id),
  url         TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('uploaded','generated','retouched')) DEFAULT 'generated',
  is_favorited BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Simple synthetic data for dev/demo
INSERT INTO users (email)
SELECT 'dev+' || i || '@profileperfect.ai'
FROM generate_series(1,5) AS s(i)
ON CONFLICT (email) DO NOTHING;
