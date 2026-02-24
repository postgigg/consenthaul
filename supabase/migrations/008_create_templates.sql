-- Migration 008: Consent Templates
-- Orgs can customize the consent form text (within FMCSA requirements).

CREATE TABLE public.consent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    consent_type public.consent_type NOT NULL DEFAULT 'limited_query',
    body_text TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, name, language)
);

CREATE INDEX idx_templates_org ON public.consent_templates(organization_id);

CREATE TRIGGER trg_templates_updated
    BEFORE UPDATE ON public.consent_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
