ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS early_access_status text NOT NULL DEFAULT 'early_access',
  ADD COLUMN IF NOT EXISTS early_access_start_date timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS founding_church boolean NOT NULL DEFAULT false;

ALTER TABLE app_feedback
  ADD COLUMN IF NOT EXISTS church_id integer REFERENCES churches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';

CREATE TABLE IF NOT EXISTS early_access_welcome_acknowledgements (
  id serial PRIMARY KEY,
  church_id integer NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  acknowledged_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT early_access_welcome_church_user_unique UNIQUE (church_id, clerk_user_id)
);

CREATE TABLE IF NOT EXISTS early_access_usage_events (
  id serial PRIMARY KEY,
  church_id integer NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  clerk_user_id text,
  event_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS early_access_usage_events_church_created_idx
  ON early_access_usage_events (church_id, created_at);