-- Add organization_id column so non-partner orgs can own migration transfers
ALTER TABLE public.migration_transfers
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Backfill existing rows from partner_applications
UPDATE public.migration_transfers mt
SET organization_id = pa.organization_id
FROM public.partner_applications pa
WHERE mt.application_id = pa.id
  AND pa.organization_id IS NOT NULL;

-- Index for org lookups
CREATE INDEX IF NOT EXISTS idx_migration_transfers_org_id
  ON public.migration_transfers(organization_id);
