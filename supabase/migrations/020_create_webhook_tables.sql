-- ============================================================================
-- 020 — Outgoing partner webhook tables
-- ============================================================================

-- 1. Enum for webhook event delivery status
DO $$ BEGIN
  CREATE TYPE public.webhook_event_status AS ENUM (
    'pending', 'delivering', 'delivered', 'failed', 'exhausted'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Webhook endpoints — partner-registered URLs
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  url               TEXT NOT NULL,
  description       TEXT,
  secret            TEXT NOT NULL,
  events            TEXT[] NOT NULL DEFAULT '{}',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_by        TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT webhook_endpoints_url_https CHECK (url LIKE 'https://%')
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org
  ON public.webhook_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org_active
  ON public.webhook_endpoints(organization_id, is_active);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_webhook_endpoints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_webhook_endpoints_updated_at ON public.webhook_endpoints;
CREATE TRIGGER trg_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_webhook_endpoints_updated_at();

-- 3. Webhook events — delivery log & retry queue
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id       UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,
  consent_id        UUID REFERENCES public.consents(id) ON DELETE SET NULL,
  payload           JSONB NOT NULL DEFAULT '{}',
  status            public.webhook_event_status NOT NULL DEFAULT 'pending',
  attempts          INTEGER NOT NULL DEFAULT 0,
  max_attempts      INTEGER NOT NULL DEFAULT 5,
  last_attempt_at   TIMESTAMPTZ,
  next_retry_at     TIMESTAMPTZ DEFAULT now(),
  response_status   INTEGER,
  response_body     TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_endpoint_created
  ON public.webhook_events(endpoint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_org_created
  ON public.webhook_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_retry_queue
  ON public.webhook_events(status, next_retry_at)
  WHERE status IN ('pending', 'failed');

-- 4. RLS policies
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Webhook endpoints: org-scoped
CREATE POLICY webhook_endpoints_select ON public.webhook_endpoints
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY webhook_endpoints_insert ON public.webhook_endpoints
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY webhook_endpoints_update ON public.webhook_endpoints
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY webhook_endpoints_delete ON public.webhook_endpoints
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- Webhook events: org-scoped
CREATE POLICY webhook_events_select ON public.webhook_events
  FOR SELECT USING (organization_id = public.get_user_org_id());
