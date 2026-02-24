-- Seed data for development/testing
-- Run with: psql $DATABASE_URL -f supabase/seed.sql

-- Create a test organization
INSERT INTO public.organizations (id, name, dot_number, mc_number, address_line1, city, state, zip, phone, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Trucking LLC',
    '1234567',
    'MC-987654',
    '123 Freight Way',
    'Dallas',
    'TX',
    '75201',
    '+12145551234',
    '{
        "default_language": "en",
        "consent_duration": "employment",
        "auto_remind": true,
        "remind_days_before": 30,
        "timezone": "America/Chicago"
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Give the test org 10 free credits
INSERT INTO public.credit_balances (organization_id, balance, lifetime_purchased, lifetime_used)
VALUES ('00000000-0000-0000-0000-000000000001', 10, 10, 0)
ON CONFLICT (organization_id) DO NOTHING;

-- Create some test drivers
INSERT INTO public.drivers (organization_id, first_name, last_name, phone, email, cdl_number, cdl_state, date_of_birth, hire_date, preferred_language)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'John', 'Martinez', '+12145559001', 'john.martinez@email.com', 'D1234567', 'TX', '1985-03-15', '2023-01-10', 'en'),
    ('00000000-0000-0000-0000-000000000001', 'Maria', 'Garcia', '+12145559002', NULL, 'G7654321', 'CA', '1990-07-22', '2024-06-01', 'es'),
    ('00000000-0000-0000-0000-000000000001', 'Robert', 'Johnson', '+12145559003', 'rjohnson@email.com', 'J9876543', 'TX', '1978-11-05', '2022-08-15', 'en'),
    ('00000000-0000-0000-0000-000000000001', 'Carlos', 'Rodriguez', '+12145559004', 'carlos.r@email.com', 'R2468135', 'AZ', '1992-01-30', '2024-02-20', 'es'),
    ('00000000-0000-0000-0000-000000000001', 'James', 'Wilson', '+12145559005', NULL, 'W1357924', 'OK', '1988-09-12', '2023-11-01', 'en')
ON CONFLICT DO NOTHING;

-- Create default consent templates
INSERT INTO public.consent_templates (organization_id, name, language, consent_type, body_text, is_default, created_by)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'Standard Annual Limited Query',
    'en',
    'limited_query',
    'I hereby provide consent to conduct a limited query of the FMCSA Commercial Driver''s License Drug and Alcohol Clearinghouse to determine whether drug or alcohol violation information about me exists in the Clearinghouse.',
    true,
    p.id
FROM public.profiles p
WHERE p.organization_id = '00000000-0000-0000-0000-000000000001'
LIMIT 1
ON CONFLICT DO NOTHING;
