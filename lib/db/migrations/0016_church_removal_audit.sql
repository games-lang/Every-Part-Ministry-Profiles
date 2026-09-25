CREATE TABLE IF NOT EXISTS church_removal_audit (
  id serial PRIMARY KEY,
  church_id integer NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  actor_name text NOT NULL,
  kind text NOT NULL,
  removed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT church_removal_audit_kind_check
    CHECK (kind IN ('profile', 'person'))
);