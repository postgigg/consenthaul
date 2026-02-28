-- Migration 027: Gap Audit Schema Changes
-- Addresses schema requirements for all 49 identified gaps across 8 categories.

-- =========================================================================
-- A4: Template versioning
-- =========================================================================
ALTER TABLE public.consent_templates ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.consent_templates ADD COLUMN IF NOT EXISTS parent_template_id UUID REFERENCES public.consent_templates(id);

-- A4 + E1: Template snapshot on consents
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.consent_templates(id);
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS template_snapshot JSONB;

-- =========================================================================
-- A1: Consent expiration tracking
-- =========================================================================
-- (No schema change needed — uses existing signing_token_expires_at + status)

-- =========================================================================
-- B2: Driver onboarding status
-- =========================================================================
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (onboarding_status IN ('pending', 'onboarding', 'active', 'suspended', 'terminated'));

-- B4: Driver segmentation / tagging
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'normal'
  CHECK (risk_level IN ('low', 'normal', 'high', 'critical'));
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS fleet TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full_time'
  CHECK (employment_type IN ('full_time', 'part_time', 'contractor', 'owner_operator'));

-- =========================================================================
-- C1: Two-factor authentication fields on profiles
-- =========================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_verified_at TIMESTAMPTZ;

-- C2: Session management
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.user_sessions(expires_at) WHERE is_active = true;

-- C4: Email verification tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- C7: Admin IP allowlist
CREATE TABLE IF NOT EXISTS public.ip_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    cidr TEXT NOT NULL,
    label TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ip_allowlist_org ON public.ip_allowlist(organization_id) WHERE is_active = true;

-- =========================================================================
-- D1: Invoice generation
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    amount_cents INTEGER NOT NULL,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    description TEXT,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    billing_email TEXT,
    billing_name TEXT,
    billing_address JSONB,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON public.invoices(stripe_invoice_id);

CREATE TRIGGER trg_invoices_updated
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D5: Low-credit warnings
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS low_credit_threshold INTEGER NOT NULL DEFAULT 5;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS low_credit_notified_at TIMESTAMPTZ;

-- D6: Credit expiration
ALTER TABLE public.credit_transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- =========================================================================
-- E4: Timezone support
-- =========================================================================
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/New_York';
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS timezone TEXT;

-- E6: Audit log immutability - deny UPDATE/DELETE
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'audit_log_no_update' AND tablename = 'audit_log'
  ) THEN
    ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
    CREATE POLICY audit_log_no_update ON public.audit_log FOR UPDATE USING (false);
    CREATE POLICY audit_log_no_delete ON public.audit_log FOR DELETE USING (false);
    CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT WITH CHECK (true);
    CREATE POLICY audit_log_select ON public.audit_log FOR SELECT USING (true);
  END IF;
END
$$;

-- =========================================================================
-- F3: Organization suspension
-- =========================================================================
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- F4: Team invite expiration
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'member',
    invited_by UUID NOT NULL REFERENCES public.profiles(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON public.team_invites(token) WHERE accepted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invites_org ON public.team_invites(organization_id);

-- F5: Owner transfer
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS pending_owner_transfer_to UUID REFERENCES public.profiles(id);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS owner_transfer_requested_at TIMESTAMPTZ;

-- =========================================================================
-- G2: Notification preferences
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_consent_signed BOOLEAN NOT NULL DEFAULT true,
    email_consent_expired BOOLEAN NOT NULL DEFAULT true,
    email_low_credits BOOLEAN NOT NULL DEFAULT true,
    email_team_changes BOOLEAN NOT NULL DEFAULT true,
    email_compliance_alerts BOOLEAN NOT NULL DEFAULT true,
    email_weekly_digest BOOLEAN NOT NULL DEFAULT true,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- G2: In-app notification center
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT NOT NULL DEFAULT 'info'
      CHECK (type IN ('info', 'success', 'warning', 'error')),
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notif_user ON public.in_app_notifications(user_id, is_read, created_at DESC);

-- =========================================================================
-- H3: API documentation metadata
-- =========================================================================
-- (No schema needed — OpenAPI spec generated from code)

-- =========================================================================
-- Deduct credit with advisory lock (D3 fix)
-- =========================================================================
CREATE OR REPLACE FUNCTION deduct_credit(
    p_org_id UUID,
    p_consent_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Advisory lock prevents concurrent overdraw
    PERFORM pg_advisory_xact_lock(hashtext(p_org_id::text));

    UPDATE public.credit_balances
    SET balance = balance - 1,
        lifetime_used = lifetime_used + 1,
        updated_at = now()
    WHERE organization_id = p_org_id
      AND balance > 0
    RETURNING balance INTO v_new_balance;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    INSERT INTO public.credit_transactions
        (organization_id, type, amount, balance_after, description, reference_id, reference_type, created_by)
    VALUES
        (p_org_id, 'usage', -1, v_new_balance, 'Consent form sent', p_consent_id::text, 'consent', p_user_id);

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- Refund credits function (D2)
-- =========================================================================
CREATE OR REPLACE FUNCTION refund_credits(
    p_org_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_reference_id TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_org_id::text));

    UPDATE public.credit_balances
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE organization_id = p_org_id
    RETURNING balance INTO v_new_balance;

    IF NOT FOUND THEN
        INSERT INTO public.credit_balances (organization_id, balance, lifetime_purchased)
        VALUES (p_org_id, p_amount, 0)
        RETURNING balance INTO v_new_balance;
    END IF;

    INSERT INTO public.credit_transactions
        (organization_id, type, amount, balance_after, description, reference_id, reference_type, created_by)
    VALUES
        (p_org_id, 'refund', p_amount, v_new_balance, p_reason, p_reference_id, 'refund', p_user_id);

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- RLS policies for new tables
-- =========================================================================

-- User sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_select ON public.user_sessions FOR SELECT USING (
    user_id = auth.uid() OR organization_id = (SELECT get_user_org_id())
);
CREATE POLICY sessions_insert ON public.user_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY sessions_update ON public.user_sessions FOR UPDATE USING (user_id = auth.uid());

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_select ON public.invoices FOR SELECT USING (
    organization_id = (SELECT get_user_org_id())
);

-- Team invites
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_select ON public.team_invites FOR SELECT USING (
    organization_id = (SELECT get_user_org_id())
);
CREATE POLICY invites_insert ON public.team_invites FOR INSERT WITH CHECK (
    organization_id = (SELECT get_user_org_id())
);

-- Notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_prefs_select ON public.notification_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notif_prefs_upsert ON public.notification_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY notif_prefs_update ON public.notification_preferences FOR UPDATE USING (user_id = auth.uid());

-- In-app notifications
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY in_app_notif_select ON public.in_app_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY in_app_notif_update ON public.in_app_notifications FOR UPDATE USING (user_id = auth.uid());

-- IP allowlist
ALTER TABLE public.ip_allowlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY ip_allowlist_select ON public.ip_allowlist FOR SELECT USING (
    organization_id = (SELECT get_user_org_id())
);
CREATE POLICY ip_allowlist_manage ON public.ip_allowlist FOR ALL USING (
    organization_id = (SELECT get_user_org_id())
);
