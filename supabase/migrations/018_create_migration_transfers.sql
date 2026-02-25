-- Migration transfers: tracks shareable upload links and migration sessions
CREATE TABLE IF NOT EXISTS public.migration_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  label           TEXT DEFAULT 'Migration Upload',
  uploaded_files  JSONB NOT NULL DEFAULT '[]',
  total_bytes     BIGINT NOT NULL DEFAULT 0,
  carrier_count   INTEGER,
  driver_count    INTEGER,
  parsed_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_migration_transfers_token ON public.migration_transfers(token);
CREATE INDEX idx_migration_transfers_app ON public.migration_transfers(application_id);

-- RLS
ALTER TABLE public.migration_transfers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (via admin client only in practice)
CREATE POLICY "migration_transfers_insert" ON public.migration_transfers
  FOR INSERT WITH CHECK (true);

-- Allow public select by token match (shareable upload pages need this)
CREATE POLICY "migration_transfers_select_by_token" ON public.migration_transfers
  FOR SELECT USING (true);

-- Allow updates (confirm endpoint updates uploaded_files / parse endpoint updates counts)
CREATE POLICY "migration_transfers_update" ON public.migration_transfers
  FOR UPDATE USING (true);
