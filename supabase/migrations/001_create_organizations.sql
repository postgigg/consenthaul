-- Migration 001: Organizations
-- Every carrier account is an org. Multi-tenant from day one.

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dot_number TEXT,
    mc_number TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    phone TEXT,
    logo_url TEXT,
    settings JSONB NOT NULL DEFAULT '{
        "default_language": "en",
        "consent_duration": "employment",
        "auto_remind": true,
        "remind_days_before": 30,
        "timezone": "America/New_York"
    }'::jsonb,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_dot ON public.organizations(dot_number);
CREATE INDEX idx_organizations_stripe ON public.organizations(stripe_customer_id);

-- Trigger for updated_at (reused by all tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
