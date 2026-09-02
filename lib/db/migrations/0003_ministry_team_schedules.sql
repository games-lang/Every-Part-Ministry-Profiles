-- One-time pastor-managed volunteer shifts scoped to a church team.
CREATE TABLE IF NOT EXISTS ministry_team_schedules (
  id serial PRIMARY KEY,
  church_id integer NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  team_id integer NOT NULL,
  profile_id integer REFERENCES ministry_profiles(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  start_time text NOT NULL,
  end_time text,
  role text NOT NULL,
  notes text,
  is_cancelled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ministry_team_schedules_team_church_fk
    FOREIGN KEY (team_id, church_id)
    REFERENCES ministry_teams(id, church_id)
);

CREATE INDEX IF NOT EXISTS ministry_team_schedules_team_date_idx
  ON ministry_team_schedules (team_id, scheduled_date, start_time);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ministry_team_schedules_time_format_check'
      AND conrelid = 'ministry_team_schedules'::regclass
  ) THEN
    ALTER TABLE ministry_team_schedules
      ADD CONSTRAINT ministry_team_schedules_time_format_check
      CHECK (
        start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        AND (end_time IS NULL OR end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
      );
  END IF;
END $$;