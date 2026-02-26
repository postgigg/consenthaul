-- Migration 026: Track TSV download timestamps for result-recording reminders
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_tsv_download_at timestamptz;
