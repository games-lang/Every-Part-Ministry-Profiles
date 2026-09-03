ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS billing_plan text NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS billing_status text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS billing_current_period_end timestamp with time zone;