DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ministry_profiles_id_church_unique'
      AND conrelid = 'ministry_profiles'::regclass
  ) THEN
    ALTER TABLE ministry_profiles
      ADD CONSTRAINT ministry_profiles_id_church_unique
      UNIQUE (id, church_id);
  END IF;
END
$$;