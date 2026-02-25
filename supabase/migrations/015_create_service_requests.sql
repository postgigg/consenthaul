-- 015: Service requests + welcome email tracking
-- ---------------------------------------------------------------------------

-- 1a. Add welcome_email_sent_at to profiles (idempotency guard)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

-- 1b. Create enums
DO $$ BEGIN
  CREATE TYPE public.service_request_category AS ENUM (
    'api_integration', 'mcp_setup', 'custom_integration', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.service_request_urgency AS ENUM (
    'low', 'medium', 'high'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.service_request_status AS ENUM (
    'pending', 'quoted', 'deposit_paid', 'in_progress', 'completed', 'cancelled', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1c. Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category                    public.service_request_category NOT NULL,
  description                 TEXT NOT NULL,
  urgency                     public.service_request_urgency NOT NULL DEFAULT 'medium',
  tms_system                  TEXT,
  status                      public.service_request_status NOT NULL DEFAULT 'pending',
  quoted_amount               DECIMAL(10,2),
  deposit_amount              DECIMAL(10,2),
  deposit_stripe_payment_intent TEXT,
  admin_notes                 TEXT,
  quoted_at                   TIMESTAMPTZ,
  deposit_paid_at             TIMESTAMPTZ,
  started_at                  TIMESTAMPTZ,
  completed_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for org lookups
CREATE INDEX IF NOT EXISTS idx_service_requests_org
  ON public.service_requests(organization_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER trg_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_service_requests_updated_at();

-- 1d. RLS policies
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their org's requests
CREATE POLICY service_requests_select ON public.service_requests
  FOR SELECT USING (
    organization_id = public.get_user_org_id()
  );

-- Users can create requests for their org
CREATE POLICY service_requests_insert ON public.service_requests
  FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id()
  );

-- Users can update their org's requests (limited by app logic)
CREATE POLICY service_requests_update ON public.service_requests
  FOR UPDATE USING (
    organization_id = public.get_user_org_id()
  );
