-- Migration 011: Auto-create org + profile for new users
-- Handles both email signup (has full_name + company_name in metadata)
-- and OAuth signup (uses Google name or email fallback).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_company_name TEXT;
    v_org_id UUID;
BEGIN
    -- Skip if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Extract name from metadata (email signup or Google OAuth)
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    v_company_name := COALESCE(
        NEW.raw_user_meta_data->>'company_name',
        v_full_name || '''s Company'
    );

    -- Create organization
    INSERT INTO public.organizations (name)
    VALUES (v_company_name)
    RETURNING id INTO v_org_id;

    -- Create profile
    INSERT INTO public.profiles (id, organization_id, role, full_name, email)
    VALUES (NEW.id, v_org_id, 'owner', v_full_name, NEW.email);

    -- Give 3 free starter credits
    INSERT INTO public.credit_balances (organization_id, balance, lifetime_purchased)
    VALUES (v_org_id, 3, 3);

    INSERT INTO public.credit_transactions (organization_id, type, amount, balance_after, description, reference_id, reference_type)
    VALUES (v_org_id, 'bonus', 3, 3, 'Welcome bonus — 3 free credits', 'signup_bonus', 'system');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire after a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
