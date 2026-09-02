-- Church-selected tradition, terminology mode, and submission-time snapshots.
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS ministry_customization jsonb;

ALTER TABLE ministry_profiles
  ADD COLUMN IF NOT EXISTS ministry_customization_snapshot jsonb;