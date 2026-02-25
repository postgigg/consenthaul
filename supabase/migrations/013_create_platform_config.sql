-- Platform-wide configuration store (encrypted values)
CREATE TABLE IF NOT EXISTS platform_config (
  key text PRIMARY KEY,
  encrypted_value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS: only service role can access
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service-role (admin client) can read/write

COMMENT ON TABLE platform_config IS 'Stores encrypted platform configuration (API keys, secrets)';
