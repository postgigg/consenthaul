-- Add escalation fields to query_records for 24-hour hit escalation workflow
ALTER TABLE query_records
  ADD COLUMN IF NOT EXISTS escalation_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_status TEXT CHECK (escalation_status IN ('pending', 'full_query_completed', 'driver_removed', 'expired')),
  ADD COLUMN IF NOT EXISTS escalation_resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for cron: find pending escalations that may have expired
CREATE INDEX idx_query_records_escalation_pending
  ON query_records (escalation_status, escalation_deadline)
  WHERE escalation_status = 'pending';
