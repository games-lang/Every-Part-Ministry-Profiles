CREATE UNIQUE INDEX IF NOT EXISTS ministry_profiles_church_id_unique
  ON ministry_profiles (church_id, id);

CREATE TABLE IF NOT EXISTS pastor_notes (
  id serial PRIMARY KEY,
  church_id integer NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  profile_id integer NOT NULL,
  author_clerk_user_id text NOT NULL,
  what_i_heard text NOT NULL DEFAULT '',
  brings_life text NOT NULL DEFAULT '',
  areas_to_explore text NOT NULL DEFAULT '',
  areas_to_avoid_for_now text NOT NULL DEFAULT '',
  training_needed text NOT NULL DEFAULT '',
  next_step text NOT NULL DEFAULT '',
  follow_up_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pastor_notes_profile_author_unique UNIQUE (profile_id, author_clerk_user_id),
  CONSTRAINT pastor_notes_profile_church_fk
    FOREIGN KEY (profile_id, church_id)
    REFERENCES ministry_profiles (id, church_id)
    ON DELETE CASCADE
);
