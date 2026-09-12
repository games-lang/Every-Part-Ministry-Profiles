ALTER TABLE pastor_notes
  DROP CONSTRAINT IF EXISTS pastor_notes_profile_church_fk;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pastor_notes_profile_id_ministry_profiles_id_fk'
      AND conrelid = 'pastor_notes'::regclass
  ) THEN
    ALTER TABLE pastor_notes
      ADD CONSTRAINT pastor_notes_profile_id_ministry_profiles_id_fk
      FOREIGN KEY (profile_id)
      REFERENCES ministry_profiles (id)
      ON DELETE CASCADE;
  END IF;
END
$$;

ALTER TABLE ministry_profiles
  DROP CONSTRAINT IF EXISTS ministry_profiles_id_church_unique;