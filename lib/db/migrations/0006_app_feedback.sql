CREATE TABLE IF NOT EXISTS app_feedback (
  id serial PRIMARY KEY,
  type text NOT NULL DEFAULT 'suggestion'
    CHECK (type IN ('suggestion', 'fix')),
  message text NOT NULL,
  contact_email text,
  source_page text NOT NULL DEFAULT 'sign-in',
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewing', 'resolved', 'dismissed')),
  admin_response text,
  responded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_feedback_status_created_at_idx
  ON app_feedback (status, created_at DESC);