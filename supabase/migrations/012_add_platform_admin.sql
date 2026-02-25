-- Add platform admin flag to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin boolean NOT NULL DEFAULT false;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_profiles_platform_admin ON profiles (is_platform_admin) WHERE is_platform_admin = true;

COMMENT ON COLUMN profiles.is_platform_admin IS 'Grants access to the platform-wide admin panel';
