CREATE TABLE IF NOT EXISTS partfinder_leadership_profiles (
  id serial PRIMARY KEY,
  church_id integer NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  profile jsonb NOT NULL,
  personalization_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partfinder_leadership_profiles_church_user_unique
    UNIQUE (church_id, clerk_user_id)
);