-- ---------------------------------------------------------------------------
-- 016: Regulatory intelligence — sources + alerts
-- ---------------------------------------------------------------------------

-- Enums
CREATE TYPE regulatory_source_type AS ENUM ('rss', 'webpage', 'api');
CREATE TYPE regulatory_alert_status AS ENUM ('new', 'reviewing', 'action_required', 'resolved', 'dismissed');

-- ---------------------------------------------------------------------------
-- regulatory_sources — configurable feeds to monitor
-- ---------------------------------------------------------------------------
CREATE TABLE regulatory_sources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  url         text NOT NULL,
  source_type regulatory_source_type NOT NULL DEFAULT 'rss',
  check_frequency_hours int NOT NULL DEFAULT 24,
  last_checked_at timestamptz,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER set_regulatory_sources_updated_at
  BEFORE UPDATE ON regulatory_sources
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ---------------------------------------------------------------------------
-- regulatory_alerts — detected changes with AI analysis
-- ---------------------------------------------------------------------------
CREATE TABLE regulatory_alerts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id           uuid REFERENCES regulatory_sources(id) ON DELETE SET NULL,
  title               text NOT NULL,
  url                 text,
  summary             text,
  content_hash        text NOT NULL,
  relevance_score     int NOT NULL DEFAULT 0 CHECK (relevance_score BETWEEN 0 AND 10),
  category            text,
  impact_assessment   text,
  recommended_actions text,
  affected_areas      text[] NOT NULL DEFAULT '{}',
  status              regulatory_alert_status NOT NULL DEFAULT 'new',
  admin_notes         text,
  reviewed_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate alerts
CREATE UNIQUE INDEX idx_regulatory_alerts_content_hash ON regulatory_alerts(content_hash);

-- Fast filtering by status and relevance
CREATE INDEX idx_regulatory_alerts_status ON regulatory_alerts(status);
CREATE INDEX idx_regulatory_alerts_relevance ON regulatory_alerts(relevance_score DESC);

-- Auto-update updated_at
CREATE TRIGGER set_regulatory_alerts_updated_at
  BEFORE UPDATE ON regulatory_alerts
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ---------------------------------------------------------------------------
-- Seed default sources
-- ---------------------------------------------------------------------------
INSERT INTO regulatory_sources (name, url, source_type, check_frequency_hours) VALUES
  ('FMCSA News & Updates',
   'https://www.fmcsa.dot.gov/newsroom/rss',
   'rss', 24),
  ('FMCSA Clearinghouse Updates',
   'https://clearinghouse.fmcsa.dot.gov/Resource/Index/Update-702',
   'webpage', 24),
  ('DOT Drug & Alcohol Testing',
   'https://www.transportation.gov/odapc/news',
   'webpage', 48),
  ('Transport Topics Regulatory',
   'https://www.ttnews.com/rss/regulatory',
   'rss', 24),
  ('Federal Register — FMCSA',
   'https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bagencies%5D%5B%5D=federal-motor-carrier-safety-administration&conditions%5Btype%5D%5B%5D=RULE&conditions%5Btype%5D%5B%5D=PRORULE&conditions%5Btype%5D%5B%5D=NOTICE',
   'rss', 24);
