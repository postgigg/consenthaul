-- Migration 003: Drivers
-- CDL drivers belong to an org. One driver can only belong to one org.

CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cdl_number TEXT,
    cdl_state TEXT,
    date_of_birth DATE,
    hire_date DATE,
    termination_date DATE,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drivers_org ON public.drivers(organization_id);
CREATE INDEX idx_drivers_org_active ON public.drivers(organization_id, is_active);
CREATE INDEX idx_drivers_cdl ON public.drivers(cdl_number, cdl_state);
CREATE INDEX idx_drivers_phone ON public.drivers(phone);
CREATE INDEX idx_drivers_name ON public.drivers(organization_id, last_name, first_name);

CREATE TRIGGER trg_drivers_updated
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
