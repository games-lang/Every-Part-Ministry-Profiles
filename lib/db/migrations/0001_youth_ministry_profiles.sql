-- Backward-compatible youth pathway support. Each statement is deliberately
-- guarded because deployments may retry this migration after an interruption.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS profile_type text;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS recommended_profile_type text;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS profile_type_overridden boolean;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS birthdate date;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS person_key uuid;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS result_token uuid;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS result_expires_at timestamp with time zone;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS youth_responses jsonb;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS guardian_observations jsonb;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS guardian_name text;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS guardian_email text;
ALTER TABLE ministry_profiles ADD COLUMN IF NOT EXISTS guardian_consent boolean;

-- Legacy rows are adults. Generate values before enforcing the new invariants.
UPDATE ministry_profiles SET profile_type = 'adult' WHERE profile_type IS NULL;
UPDATE ministry_profiles SET profile_type_overridden = false WHERE profile_type_overridden IS NULL;
UPDATE ministry_profiles
SET person_key = gen_random_uuid()
WHERE person_key IS NULL;
UPDATE ministry_profiles
SET result_token = gen_random_uuid()
WHERE result_token IS NULL;

-- Defend the unique index against a manually imported duplicate token.
WITH duplicate_tokens AS (
  SELECT id, row_number() OVER (PARTITION BY result_token ORDER BY id) AS ordinal
  FROM ministry_profiles
)
UPDATE ministry_profiles AS profile
SET result_token = gen_random_uuid()
FROM duplicate_tokens
WHERE profile.id = duplicate_tokens.id AND duplicate_tokens.ordinal > 1;

ALTER TABLE ministry_profiles ALTER COLUMN profile_type SET DEFAULT 'adult';
ALTER TABLE ministry_profiles ALTER COLUMN profile_type SET NOT NULL;
ALTER TABLE ministry_profiles ALTER COLUMN profile_type_overridden SET DEFAULT false;
ALTER TABLE ministry_profiles ALTER COLUMN profile_type_overridden SET NOT NULL;
ALTER TABLE ministry_profiles ALTER COLUMN person_key SET DEFAULT gen_random_uuid();
ALTER TABLE ministry_profiles ALTER COLUMN person_key SET NOT NULL;
ALTER TABLE ministry_profiles ALTER COLUMN result_token SET DEFAULT gen_random_uuid();
ALTER TABLE ministry_profiles ALTER COLUMN result_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ministry_profiles_result_token_unique
  ON ministry_profiles (result_token);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ministry_profiles_profile_type_check'
      AND conrelid = 'ministry_profiles'::regclass
  ) THEN
    ALTER TABLE ministry_profiles ADD CONSTRAINT ministry_profiles_profile_type_check
      CHECK (profile_type IN ('adult', 'discover', 'explore', 'develop'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ministry_profiles_age_check'
      AND conrelid = 'ministry_profiles'::regclass
  ) THEN
    ALTER TABLE ministry_profiles ADD CONSTRAINT ministry_profiles_age_check
      CHECK (
        (profile_type = 'adult' AND (age IS NULL OR age >= 18))
        OR (
          profile_type IN ('discover', 'explore', 'develop')
          AND age IS NOT NULL
          AND age BETWEEN 6 AND 17
          AND (
            profile_type_overridden = true
            OR (profile_type = 'discover' AND age BETWEEN 6 AND 8)
            OR (profile_type = 'explore' AND age BETWEEN 9 AND 12)
            OR (profile_type = 'develop' AND age BETWEEN 13 AND 17)
          )
        )
      );
  END IF;
END $$;