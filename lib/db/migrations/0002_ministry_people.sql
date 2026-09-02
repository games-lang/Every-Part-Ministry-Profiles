-- Pastor-managed people records hold contact details separately from completed
-- assessment snapshots. Invite tokens are opaque, unique, and expire in the
-- application after a fixed period.
CREATE TABLE IF NOT EXISTS ministry_people (
  id serial PRIMARY KEY,
  church_id integer NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  profile_id integer REFERENCES ministry_profiles(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text,
  invite_token uuid NOT NULL DEFAULT gen_random_uuid(),
  invite_status text NOT NULL DEFAULT 'pending',
  invite_expires_at timestamp with time zone NOT NULL,
  invite_sent_at timestamp with time zone,
  source text NOT NULL DEFAULT 'manual',
  external_id text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ministry_people_invite_token_unique
  ON ministry_people (invite_token);