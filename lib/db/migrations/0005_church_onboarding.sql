ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone;

-- Existing churches already completed setup through the original Church Setup
-- page. Only churches created after this migration should enter onboarding.
UPDATE churches
SET onboarding_completed_at = COALESCE(updated_at, created_at, now())
WHERE onboarding_completed_at IS NULL;