-- ============================================================================
-- 017 — Partner application & organization tables
-- ============================================================================

-- 1. Enum for partner application status
DO $$ BEGIN
  CREATE TYPE public.partner_application_status AS ENUM (
    'pending', 'paid', 'provisioning', 'active', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add is_partner flag to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_partner BOOLEAN NOT NULL DEFAULT false;

-- 3. Partner applications table
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company info
  company_name                TEXT NOT NULL,
  website_url                 TEXT,
  employee_count_range        TEXT NOT NULL,
  contact_name                TEXT NOT NULL,
  contact_email               TEXT NOT NULL,
  contact_phone               TEXT NOT NULL,
  partnership_reason          TEXT NOT NULL,
  tms_platform_name           TEXT NOT NULL,

  -- Volume estimates
  carrier_count_range         TEXT NOT NULL,
  consents_per_carrier_month  TEXT NOT NULL,
  estimated_annual_consents   INTEGER NOT NULL DEFAULT 0,
  recommended_pack_id         TEXT,

  -- Migration
  has_migration_data          BOOLEAN NOT NULL DEFAULT false,
  migration_file_paths        TEXT[] DEFAULT '{}',
  migration_total_bytes       BIGINT DEFAULT 0,
  migration_fee_cents         INTEGER DEFAULT 0,
  auto_create_carriers        BOOLEAN NOT NULL DEFAULT false,
  auto_create_fee_cents       INTEGER DEFAULT 0,

  -- Credit pack selection
  selected_pack_id            TEXT NOT NULL,
  selected_pack_credits       INTEGER NOT NULL,
  selected_pack_price_cents   INTEGER NOT NULL,

  -- Legal
  partner_agreement_accepted  BOOLEAN NOT NULL DEFAULT false,
  data_processing_accepted    BOOLEAN NOT NULL DEFAULT false,
  legal_signatory_name        TEXT NOT NULL,
  legal_accepted_at           TIMESTAMPTZ,

  -- Payment
  onboarding_fee_cents        INTEGER NOT NULL DEFAULT 500000,
  total_amount_cents          INTEGER NOT NULL,
  stripe_checkout_session_id  TEXT,
  stripe_payment_intent_id    TEXT,

  -- Status & provisioning
  status                      public.partner_application_status NOT NULL DEFAULT 'pending',
  organization_id             UUID REFERENCES public.organizations(id),
  provisioned_at              TIMESTAMPTZ,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_applications_status
  ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_email
  ON public.partner_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_partner_applications_stripe_session
  ON public.partner_applications(stripe_checkout_session_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_partner_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partner_applications_updated_at ON public.partner_applications;
CREATE TRIGGER trg_partner_applications_updated_at
  BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_partner_applications_updated_at();

-- 4. Partner organizations join table (partner → carrier sub-orgs)
CREATE TABLE IF NOT EXISTS public.partner_organizations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  carrier_org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_from_migration BOOLEAN NOT NULL DEFAULT false,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_partner_carrier UNIQUE (partner_org_id, carrier_org_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_organizations_partner
  ON public.partner_organizations(partner_org_id);
CREATE INDEX IF NOT EXISTS idx_partner_organizations_carrier
  ON public.partner_organizations(carrier_org_id);

-- 5. RLS policies
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_organizations ENABLE ROW LEVEL SECURITY;

-- Partner applications: public INSERT (no auth needed for applying)
CREATE POLICY partner_applications_insert ON public.partner_applications
  FOR INSERT WITH CHECK (true);

-- Partner applications: org-scoped SELECT (partner can view their own after provisioning)
CREATE POLICY partner_applications_select ON public.partner_applications
  FOR SELECT USING (organization_id = public.get_user_org_id());

-- Partner organizations: org-scoped SELECT
CREATE POLICY partner_organizations_select ON public.partner_organizations
  FOR SELECT USING (partner_org_id = public.get_user_org_id());

-- Partner organizations: org-scoped INSERT (partner can link carriers)
CREATE POLICY partner_organizations_insert ON public.partner_organizations
  FOR INSERT WITH CHECK (partner_org_id = public.get_user_org_id());

-- Partner organizations: org-scoped UPDATE
CREATE POLICY partner_organizations_update ON public.partner_organizations
  FOR UPDATE USING (partner_org_id = public.get_user_org_id());
