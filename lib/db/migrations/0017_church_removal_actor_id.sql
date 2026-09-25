ALTER TABLE church_removal_audit
  ADD COLUMN IF NOT EXISTS actor_clerk_user_id text;