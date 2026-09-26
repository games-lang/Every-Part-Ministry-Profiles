-- The old false value was the default, not a reliable record of an intentional opt-out.
-- Switch existing pre-launch churches to integrated without changing any assessment drafts.
ALTER TABLE churches ALTER COLUMN integrated_assessment_pilot_enabled SET DEFAULT true;
UPDATE churches SET integrated_assessment_pilot_enabled = true
WHERE integrated_assessment_pilot_enabled IS DISTINCT FROM true;