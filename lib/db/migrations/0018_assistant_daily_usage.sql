CREATE TABLE IF NOT EXISTS assistant_daily_usage (
  utc_day date PRIMARY KEY,
  call_count integer NOT NULL DEFAULT 0,
  CONSTRAINT assistant_daily_usage_nonnegative CHECK (call_count >= 0)
);
