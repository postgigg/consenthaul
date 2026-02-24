-- Migration 004: Consents
-- The core table. Each row = one consent request sent to a driver.

CREATE TYPE public.consent_status AS ENUM (
    'pending', 'sent', 'delivered', 'opened', 'signed', 'expired', 'revoked', 'failed'
);

CREATE TYPE public.consent_type AS ENUM (
    'limited_query', 'pre_employment', 'blanket'
);

CREATE TYPE public.delivery_method AS ENUM ('sms', 'whatsapp', 'email', 'manual');

CREATE TABLE public.consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),

    -- Consent details
    consent_type public.consent_type NOT NULL DEFAULT 'limited_query',
    status public.consent_status NOT NULL DEFAULT 'pending',
    language TEXT NOT NULL DEFAULT 'en',

    -- Consent scope
    consent_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    consent_end_date DATE,
    query_frequency TEXT DEFAULT 'annual',

    -- Delivery
    delivery_method public.delivery_method NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_sid TEXT,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,

    -- Signing
    signing_token TEXT UNIQUE,
    signing_token_expires_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    signer_ip INET,
    signer_user_agent TEXT,
    signature_data TEXT,
    signature_hash TEXT,

    -- PDF
    pdf_storage_path TEXT,
    pdf_hash TEXT,
    pdf_generated_at TIMESTAMPTZ,

    -- Snapshot of driver + org info at time of signing (immutable audit record)
    driver_snapshot JSONB,
    organization_snapshot JSONB,

    -- Retention
    retention_expires_at TIMESTAMPTZ,
    is_archived BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consents_org ON public.consents(organization_id);
CREATE INDEX idx_consents_driver ON public.consents(driver_id);
CREATE INDEX idx_consents_org_status ON public.consents(organization_id, status);
CREATE INDEX idx_consents_token ON public.consents(signing_token) WHERE signing_token IS NOT NULL;
CREATE INDEX idx_consents_org_created ON public.consents(organization_id, created_at DESC);
CREATE INDEX idx_consents_retention ON public.consents(retention_expires_at)
    WHERE is_archived = false AND status = 'signed';
CREATE INDEX idx_consents_pending_expiry ON public.consents(signing_token_expires_at)
    WHERE status IN ('pending', 'sent', 'delivered', 'opened');

CREATE TRIGGER trg_consents_updated
    BEFORE UPDATE ON public.consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set retention date on signing
CREATE OR REPLACE FUNCTION set_retention_on_sign()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'signed' AND OLD.status != 'signed' THEN
        NEW.retention_expires_at = NEW.signed_at + INTERVAL '3 years';
        NEW.signed_at = COALESCE(NEW.signed_at, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_consents_retention
    BEFORE UPDATE ON public.consents
    FOR EACH ROW EXECUTE FUNCTION set_retention_on_sign();
