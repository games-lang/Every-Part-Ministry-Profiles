ALTER TABLE churches ADD COLUMN IF NOT EXISTS integrated_assessment_pilot_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS integrated_assessment jsonb;
CREATE TABLE IF NOT EXISTS integrated_assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id integer NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  source_hash text NOT NULL,
  revision integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  snapshot jsonb NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  form_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile_id integer REFERENCES ministry_profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  CONSTRAINT integrated_attempt_state_check CHECK (
    revision >= 0 AND (
      (status = 'draft' AND profile_id IS NULL AND completed_at IS NULL) OR
      (status = 'completed' AND profile_id IS NOT NULL AND completed_at IS NOT NULL)
    )
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS integrated_attempt_token_hash_unique ON integrated_assessment_attempts(token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS integrated_attempt_profile_unique ON integrated_assessment_attempts(profile_id);
CREATE INDEX IF NOT EXISTS integrated_attempt_church_created_idx ON integrated_assessment_attempts(church_id, created_at);
CREATE INDEX IF NOT EXISTS integrated_attempt_source_created_idx ON integrated_assessment_attempts(source_hash, created_at);