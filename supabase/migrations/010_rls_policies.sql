-- Migration 010: Row Level Security
-- Multi-tenant isolation. Every query is scoped to the user's org.

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations
CREATE POLICY "Users can view own org"
    ON public.organizations FOR SELECT
    USING (id = public.get_user_org_id());

CREATE POLICY "Owners can update own org"
    ON public.organizations FOR UPDATE
    USING (id = public.get_user_org_id())
    WITH CHECK (id = public.get_user_org_id());

-- Profiles
CREATE POLICY "Users can view org members"
    ON public.profiles FOR SELECT
    USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Drivers
CREATE POLICY "Users can view org drivers"
    ON public.drivers FOR SELECT
    USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can insert org drivers"
    ON public.drivers FOR INSERT
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update org drivers"
    ON public.drivers FOR UPDATE
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

-- Consents
CREATE POLICY "Users can view org consents"
    ON public.consents FOR SELECT
    USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can insert org consents"
    ON public.consents FOR INSERT
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update org consents"
    ON public.consents FOR UPDATE
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

-- Credits
CREATE POLICY "Users can view org credits"
    ON public.credit_balances FOR SELECT
    USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can view org credit transactions"
    ON public.credit_transactions FOR SELECT
    USING (organization_id = public.get_user_org_id());

-- Audit log (read-only)
CREATE POLICY "Users can view org audit log"
    ON public.audit_log FOR SELECT
    USING (organization_id = public.get_user_org_id());

-- API keys
CREATE POLICY "Users can view org API keys"
    ON public.api_keys FOR SELECT
    USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can manage org API keys"
    ON public.api_keys FOR ALL
    USING (
        organization_id = public.get_user_org_id()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Templates
CREATE POLICY "Users can view org templates"
    ON public.consent_templates FOR SELECT
    USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage org templates"
    ON public.consent_templates FOR ALL
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

-- Notifications
CREATE POLICY "Users can view org notifications"
    ON public.notifications FOR SELECT
    USING (organization_id = public.get_user_org_id());
