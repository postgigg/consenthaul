-- ==========================================================================
-- Outreach / Sales Grinder tables
-- ==========================================================================

-- Pipeline stages
CREATE TYPE public.pipeline_stage AS ENUM (
  'lead', 'contacted', 'replied', 'demo', 'trial', 'customer', 'lost'
);

-- Campaign status
CREATE TYPE public.campaign_status AS ENUM (
  'draft', 'active', 'paused', 'completed'
);

-- Enrollment status
CREATE TYPE public.enrollment_status AS ENUM (
  'active', 'completed', 'paused', 'replied', 'bounced', 'unsubscribed'
);

-- Outreach event types
CREATE TYPE public.outreach_event_type AS ENUM (
  'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed', 'complaint'
);

-- -------------------------------------------------------------------------
-- 1. outreach_leads — Prospect carriers
-- -------------------------------------------------------------------------
CREATE TABLE public.outreach_leads (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name  TEXT NOT NULL,
    dot_number    TEXT,
    mc_number     TEXT,
    phone         TEXT,
    email         TEXT,
    contact_name  TEXT,
    contact_title TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city          TEXT,
    state         TEXT,
    zip           TEXT,
    fleet_size    INTEGER,
    driver_count  INTEGER,
    carrier_operation TEXT,   -- 'interstate', 'intrastate', etc.
    operating_status  TEXT,   -- 'AUTHORIZED', 'NOT AUTHORIZED', etc.
    pipeline_stage    public.pipeline_stage NOT NULL DEFAULT 'lead',
    lead_score        INTEGER DEFAULT 0,
    lead_source       TEXT,  -- 'csv_import', 'fmcsa_lookup', 'manual', 'website'
    ai_summary        TEXT,
    tags              TEXT[] DEFAULT '{}',
    do_not_contact    BOOLEAN NOT NULL DEFAULT FALSE,
    last_contacted_at TIMESTAMPTZ,
    organization_id   UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outreach_leads_dot ON public.outreach_leads(dot_number);
CREATE INDEX idx_outreach_leads_stage ON public.outreach_leads(pipeline_stage);
CREATE INDEX idx_outreach_leads_score ON public.outreach_leads(lead_score DESC);
CREATE INDEX idx_outreach_leads_state ON public.outreach_leads(state);
CREATE INDEX idx_outreach_leads_fleet ON public.outreach_leads(fleet_size);
CREATE INDEX idx_outreach_leads_email ON public.outreach_leads(email);

CREATE TRIGGER trg_outreach_leads_updated
    BEFORE UPDATE ON public.outreach_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------------------
-- 2. outreach_campaigns — Named campaigns
-- -------------------------------------------------------------------------
CREATE TABLE public.outreach_campaigns (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    description   TEXT,
    status        public.campaign_status NOT NULL DEFAULT 'draft',
    target_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- target_filters: { states: string[], fleet_min: number, fleet_max: number, tags: string[] }
    send_settings  JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- send_settings: { daily_limit: 50, send_window_start: "09:00", send_window_end: "17:00", timezone: "America/Chicago", from_name: "...", from_email: "..." }
    stats_sent     INTEGER NOT NULL DEFAULT 0,
    stats_opened   INTEGER NOT NULL DEFAULT 0,
    stats_clicked  INTEGER NOT NULL DEFAULT 0,
    stats_replied  INTEGER NOT NULL DEFAULT 0,
    stats_bounced  INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_outreach_campaigns_updated
    BEFORE UPDATE ON public.outreach_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------------------
-- 3. outreach_sequence_steps — Email steps per campaign
-- -------------------------------------------------------------------------
CREATE TABLE public.outreach_sequence_steps (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id      UUID NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    step_order       INTEGER NOT NULL,
    delay_days       INTEGER NOT NULL DEFAULT 0,
    subject          TEXT,
    body_html        TEXT,
    body_text        TEXT,
    use_ai_generation BOOLEAN NOT NULL DEFAULT FALSE,
    ai_prompt         TEXT,
    skip_if_replied   BOOLEAN NOT NULL DEFAULT TRUE,
    skip_if_opened    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(campaign_id, step_order)
);

CREATE TRIGGER trg_outreach_steps_updated
    BEFORE UPDATE ON public.outreach_sequence_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------------------
-- 4. outreach_enrollments — Lead-to-campaign join
-- -------------------------------------------------------------------------
CREATE TABLE public.outreach_enrollments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id  UUID NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    lead_id      UUID NOT NULL REFERENCES public.outreach_leads(id) ON DELETE CASCADE,
    status       public.enrollment_status NOT NULL DEFAULT 'active',
    current_step INTEGER NOT NULL DEFAULT 0,
    next_send_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(campaign_id, lead_id)
);

CREATE INDEX idx_outreach_enrollments_next_send
    ON public.outreach_enrollments(next_send_at)
    WHERE status = 'active';

CREATE TRIGGER trg_outreach_enrollments_updated
    BEFORE UPDATE ON public.outreach_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------------------
-- 5. outreach_events — All tracking events
-- -------------------------------------------------------------------------
CREATE TABLE public.outreach_events (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id         UUID REFERENCES public.outreach_enrollments(id) ON DELETE SET NULL,
    lead_id               UUID NOT NULL REFERENCES public.outreach_leads(id) ON DELETE CASCADE,
    campaign_id           UUID REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL,
    step_id               UUID REFERENCES public.outreach_sequence_steps(id) ON DELETE SET NULL,
    event_type            public.outreach_event_type NOT NULL,
    resend_message_id     TEXT,
    ai_reply_classification TEXT,
    ai_reply_summary      TEXT,
    details               JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outreach_events_type_created
    ON public.outreach_events(event_type, created_at DESC);
CREATE INDEX idx_outreach_events_resend_id
    ON public.outreach_events(resend_message_id)
    WHERE resend_message_id IS NOT NULL;
CREATE INDEX idx_outreach_events_lead
    ON public.outreach_events(lead_id, created_at DESC);
