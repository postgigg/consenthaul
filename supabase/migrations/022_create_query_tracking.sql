-- Query tracking for FMCSA Clearinghouse annual limited queries
CREATE TABLE IF NOT EXISTS query_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  consent_id UUID REFERENCES consents(id) ON DELETE SET NULL,
  query_type TEXT NOT NULL DEFAULT 'limited' CHECK (query_type IN ('limited', 'pre_employment')),
  query_date DATE NOT NULL,
  result TEXT CHECK (result IN ('no_violations', 'violations_found', 'pending', 'error')) DEFAULT 'pending',
  result_notes TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup: all queries for an org+driver ordered by date
CREATE INDEX idx_query_records_org_driver_date
  ON query_records (organization_id, driver_id, query_date DESC);

-- RLS
ALTER TABLE query_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org query records"
  ON query_records FOR SELECT
  USING (organization_id = (SELECT get_user_org_id()));

CREATE POLICY "Users can insert their org query records"
  ON query_records FOR INSERT
  WITH CHECK (organization_id = (SELECT get_user_org_id()));

CREATE POLICY "Users can update their org query records"
  ON query_records FOR UPDATE
  USING (organization_id = (SELECT get_user_org_id()));
