-- Migration 025: Fix deduct_credit RLS bypass
-- The deduct_credit function needs SECURITY DEFINER to UPDATE credit_balances
-- since there is no UPDATE RLS policy on that table (by design — only the
-- system should modify balances, not end users directly).

CREATE OR REPLACE FUNCTION deduct_credit(
    p_org_id UUID,
    p_consent_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
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

-- Also fix add_credits for consistency (currently works via service role,
-- but SECURITY DEFINER is the correct pattern for system-level mutations).
CREATE OR REPLACE FUNCTION add_credits(
    p_org_id UUID,
    p_amount INTEGER,
    p_stripe_payment_id TEXT,
    p_description TEXT DEFAULT 'Credit pack purchase'
) RETURNS INTEGER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    INSERT INTO public.credit_balances (organization_id, balance, lifetime_purchased)
    VALUES (p_org_id, p_amount, p_amount)
    ON CONFLICT (organization_id) DO UPDATE
    SET balance = credit_balances.balance + p_amount,
        lifetime_purchased = credit_balances.lifetime_purchased + p_amount,
        updated_at = now()
    RETURNING balance INTO v_new_balance;

    INSERT INTO public.credit_transactions
        (organization_id, type, amount, balance_after, description, reference_id, reference_type)
    VALUES
        (p_org_id, 'purchase', p_amount, v_new_balance, p_description, p_stripe_payment_id, 'stripe_payment');

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
