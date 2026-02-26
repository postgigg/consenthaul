-- Add magic_link column to partner_applications for one-time login links
ALTER TABLE partner_applications
  ADD COLUMN IF NOT EXISTS magic_link text;
