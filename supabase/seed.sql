-- =============================================================================
-- ConsentHaul Seed Data — Realistic Production-like Dataset
-- Run with: psql $DATABASE_URL -f supabase/seed.sql
-- =============================================================================

-- Clean up existing seed data (safe re-run)
DELETE FROM public.audit_log WHERE organization_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);
DELETE FROM public.notifications WHERE organization_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);
DELETE FROM public.consents WHERE organization_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);
DELETE FROM public.drivers WHERE organization_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);
DELETE FROM public.consent_templates WHERE organization_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);
DELETE FROM public.credit_transactions WHERE organization_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);
DELETE FROM public.credit_balances WHERE organization_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);
DELETE FROM public.api_keys WHERE organization_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);
DELETE FROM public.organizations WHERE id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);


-- =============================================================================
-- ORGANIZATIONS (3 realistic carriers)
-- =============================================================================

INSERT INTO public.organizations (id, name, dot_number, mc_number, address_line1, address_line2, city, state, zip, phone, settings) VALUES

('00000000-0000-0000-0000-000000000001',
 'Acme Freight LLC',
 '2847193',
 'MC-584210',
 '4200 Interstate Blvd',
 'Suite 300',
 'Dallas',
 'TX',
 '75234',
 '+12145557890',
 '{
    "default_language": "en",
    "consent_duration": "employment",
    "auto_remind": true,
    "remind_days_before": 30,
    "timezone": "America/Chicago"
 }'::jsonb),

('00000000-0000-0000-0000-000000000002',
 'Southwest Haulers Inc.',
 '1593748',
 'MC-291653',
 '780 Logistics Parkway',
 NULL,
 'Phoenix',
 'AZ',
 '85034',
 '+16025553456',
 '{
    "default_language": "en",
    "consent_duration": "annual",
    "auto_remind": true,
    "remind_days_before": 14,
    "timezone": "America/Phoenix"
 }'::jsonb),

('00000000-0000-0000-0000-000000000003',
 'Great Plains Transport Co.',
 '3061582',
 'MC-718394',
 '1100 Heartland Drive',
 'Building C',
 'Oklahoma City',
 'OK',
 '73112',
 '+14055551200',
 '{
    "default_language": "en",
    "consent_duration": "employment",
    "auto_remind": true,
    "remind_days_before": 30,
    "timezone": "America/Chicago"
 }'::jsonb);


-- =============================================================================
-- CREDIT BALANCES
-- =============================================================================

INSERT INTO public.credit_balances (organization_id, balance, lifetime_purchased, lifetime_used) VALUES
('00000000-0000-0000-0000-000000000001', 47, 100, 53),
('00000000-0000-0000-0000-000000000002', 12, 25, 13),
('00000000-0000-0000-0000-000000000003', 88, 100, 12);


-- =============================================================================
-- CREDIT TRANSACTIONS (purchase + usage history)
-- =============================================================================

INSERT INTO public.credit_transactions (id, organization_id, type, amount, balance_after, description, reference_id, reference_type, created_at) VALUES

-- Acme Freight
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'bonus', 3, 3, 'Welcome starter credits', NULL, NULL, NOW() - INTERVAL '90 days'),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'purchase', 50, 53, 'Standard Pack – 50 credits', 'pi_3Ox1a2b3c4d5e6f7', 'stripe_payment', NOW() - INTERVAL '85 days'),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'usage', -1, 52, 'Consent sent to John Martinez', NULL, 'consent', NOW() - INTERVAL '80 days'),
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'usage', -1, 51, 'Consent sent to Maria Garcia', NULL, 'consent', NOW() - INTERVAL '75 days'),
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'purchase', 50, 100, 'Standard Pack – 50 credits', 'pi_4Px2b3c4d5e6f7g8', 'stripe_payment', NOW() - INTERVAL '30 days'),
('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'usage', -1, 99, 'Consent sent to Robert Johnson', NULL, 'consent', NOW() - INTERVAL '25 days'),

-- Southwest Haulers
('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'bonus', 3, 3, 'Welcome starter credits', NULL, NULL, NOW() - INTERVAL '60 days'),
('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'purchase', 25, 28, 'Starter Pack – 25 credits', 'pi_5Qx3c4d5e6f7g8h9', 'stripe_payment', NOW() - INTERVAL '55 days'),

-- Great Plains
('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'bonus', 3, 3, 'Welcome starter credits', NULL, NULL, NOW() - INTERVAL '45 days'),
('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'purchase', 100, 103, 'Bulk Pack – 100 credits', 'pi_6Rx4d5e6f7g8h9i0', 'stripe_payment', NOW() - INTERVAL '40 days');


-- =============================================================================
-- DRIVERS (20 realistic drivers across 3 orgs)
-- =============================================================================

-- Fixed UUIDs for drivers so consents can reference them
INSERT INTO public.drivers (id, organization_id, first_name, last_name, phone, email, cdl_number, cdl_state, date_of_birth, hire_date, preferred_language, is_active) VALUES

-- Acme Freight LLC (10 drivers)
('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'John', 'Martinez', '+12145559001', 'john.martinez@email.com', 'TX-28491037', 'TX', '1985-03-15', '2023-01-10', 'en', true),
('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Maria', 'Garcia', '+12145559002', 'maria.garcia@email.com', 'CA-76321854', 'CA', '1990-07-22', '2024-06-01', 'es', true),
('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Robert', 'Johnson', '+12145559003', 'rjohnson@email.com', 'TX-59183724', 'TX', '1978-11-05', '2022-08-15', 'en', true),
('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Carlos', 'Rodriguez', '+12145559004', 'carlos.r@email.com', 'AZ-41928376', 'AZ', '1992-01-30', '2024-02-20', 'es', true),
('d0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'James', 'Wilson', '+12145559005', NULL, 'OK-83716254', 'OK', '1988-09-12', '2023-11-01', 'en', true),
('d0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Angela', 'Thompson', '+12145559006', 'angela.t@email.com', 'TX-62847193', 'TX', '1993-04-18', '2024-09-15', 'en', true),
('d0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Miguel', 'Hernandez', '+12145559007', NULL, 'TX-95173824', 'TX', '1986-12-03', '2021-03-22', 'es', true),
('d0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'David', 'Chen', '+12145559008', 'dchen@email.com', 'TX-37284916', 'TX', '1991-08-27', '2023-07-08', 'en', true),
('d0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Patricia', 'Williams', '+12145559009', 'p.williams@email.com', 'TX-14829375', 'TX', '1982-06-14', '2020-11-30', 'en', true),
('d0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Frank', 'Davis', '+12145559010', NULL, 'NM-72591346', 'NM', '1975-02-09', '2019-05-14', 'en', false),

-- Southwest Haulers Inc. (6 drivers)
('d0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 'Lisa', 'Morales', '+16025559011', 'lisa.morales@email.com', 'AZ-48271639', 'AZ', '1987-05-20', '2024-01-08', 'en', true),
('d0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 'Kevin', 'Nguyen', '+16025559012', 'knguyen@email.com', 'AZ-93715284', 'AZ', '1994-10-11', '2024-04-15', 'en', true),
('d0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', 'Sandra', 'Lopez', '+16025559013', NULL, 'CA-26184739', 'CA', '1989-03-28', '2023-09-20', 'es', true),
('d0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', 'Brian', 'Miller', '+16025559014', 'b.miller@email.com', 'NV-51739284', 'NV', '1981-07-16', '2022-12-01', 'en', true),
('d0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000002', 'Rosa', 'Gutierrez', '+16025559015', NULL, 'AZ-84627193', 'AZ', '1996-01-25', '2025-01-06', 'es', true),
('d0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000002', 'Thomas', 'Baker', '+16025559016', 'tbaker@email.com', 'AZ-39172648', 'AZ', '1979-11-30', '2021-06-10', 'en', false),

-- Great Plains Transport Co. (4 drivers)
('d0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000003', 'William', 'Turner', '+14055559017', 'w.turner@email.com', 'OK-61839274', 'OK', '1984-08-05', '2023-03-12', 'en', true),
('d0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000003', 'Jennifer', 'Scott', '+14055559018', 'j.scott@email.com', 'OK-27491638', 'OK', '1991-12-19', '2024-07-01', 'en', true),
('d0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000003', 'Eduardo', 'Reyes', '+14055559019', NULL, 'TX-58173926', 'TX', '1988-04-02', '2024-10-15', 'es', true),
('d0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000003', 'Rachel', 'Adams', '+14055559020', 'r.adams@email.com', 'KS-42918376', 'KS', '1993-09-08', '2025-01-20', 'en', true);


-- =============================================================================
-- CONSENT TEMPLATES
-- =============================================================================

INSERT INTO public.consent_templates (id, organization_id, name, language, consent_type, body_text, is_default, is_active, created_by) VALUES

-- Acme Freight templates
('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'Standard Annual Limited Query', 'en', 'limited_query',
 'I hereby authorize the above-named employer to conduct a limited query of the FMCSA Commercial Driver''s License Drug and Alcohol Clearinghouse (Clearinghouse) to determine whether drug or alcohol violation information about me exists in the Clearinghouse.

I understand that if the limited query indicates that drug or alcohol violation information about me exists in the Clearinghouse, FMCSA will not disclose that information to the employer without first obtaining additional specific consent from me. 49 CFR Part 40.

I understand that if I refuse to provide consent for the limited query, the employer must conduct a full query per §382.701(b), which requires separate electronic consent through the Clearinghouse.

This consent is valid for the duration of my employment with the above-named employer, or until I revoke this consent in writing. I may revoke this consent at any time by submitting a written request to the employer.

I certify that all information provided herein is true, accurate, and complete to the best of my knowledge and belief.',
 true, true, '84bd8eb2-d684-4771-8aff-f1e010cd73ed'),

('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'Consulta Limitada Anual Estándar', 'es', 'limited_query',
 'Por la presente autorizo al empleador mencionado anteriormente a realizar una consulta limitada del FMCSA Commercial Driver''s License Drug and Alcohol Clearinghouse (Clearinghouse) para determinar si existe información sobre violaciones de drogas o alcohol sobre mí en el Clearinghouse.

Entiendo que si la consulta limitada indica que existe información sobre violaciones de drogas o alcohol en el Clearinghouse, FMCSA no divulgará esa información al empleador sin obtener primero mi consentimiento adicional específico. 49 CFR Parte 40.

Entiendo que si me niego a proporcionar consentimiento para la consulta limitada, el empleador debe realizar una consulta completa según §382.701(b), que requiere consentimiento electrónico por separado a través del Clearinghouse.

Certifico que toda la información proporcionada aquí es verdadera, precisa y completa según mi leal saber y entender.',
 false, true, '84bd8eb2-d684-4771-8aff-f1e010cd73ed'),

('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
 'Pre-Employment Full Query', 'en', 'pre_employment',
 'I hereby authorize the above-named prospective employer to conduct a full query of the FMCSA Commercial Driver''s License Drug and Alcohol Clearinghouse as part of the pre-employment screening process.

I understand that the full query will disclose whether any drug or alcohol violation information exists in the Clearinghouse, including the type of violation and the date of the violation determination.

This consent is valid only for this specific pre-employment query and does not authorize any subsequent queries.',
 false, true, '84bd8eb2-d684-4771-8aff-f1e010cd73ed'),

-- Southwest Haulers templates
('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002',
 'Standard Annual Limited Query', 'en', 'limited_query',
 'I hereby authorize the above-named employer to conduct a limited query of the FMCSA Commercial Driver''s License Drug and Alcohol Clearinghouse (Clearinghouse) to determine whether drug or alcohol violation information about me exists in the Clearinghouse.

I understand that if the limited query indicates that drug or alcohol violation information about me exists in the Clearinghouse, FMCSA will not disclose that information to the employer without first obtaining additional specific consent from me. 49 CFR Part 40.

This consent is valid for the duration of my employment or until revoked in writing.',
 true, true, '84bd8eb2-d684-4771-8aff-f1e010cd73ed'),

-- Great Plains templates
('e0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003',
 'Standard Annual Limited Query', 'en', 'limited_query',
 'I hereby authorize Great Plains Transport Co. to conduct a limited query of the FMCSA Commercial Driver''s License Drug and Alcohol Clearinghouse to determine whether drug or alcohol violation information about me exists in the Clearinghouse.

I understand that if the limited query indicates that drug or alcohol violation information about me exists in the Clearinghouse, FMCSA will not disclose that information to the employer without first obtaining additional specific consent from me.

This consent is valid for the current calendar year and must be renewed annually.',
 true, true, '84bd8eb2-d684-4771-8aff-f1e010cd73ed');


-- =============================================================================
-- CONSENTS (various statuses — the core of the app)
-- =============================================================================

INSERT INTO public.consents (id, organization_id, driver_id, created_by, consent_type, status, language, delivery_method, delivery_address, signing_token, signing_token_expires_at, consent_start_date, consent_end_date, delivered_at, opened_at, signed_at, signer_ip, signer_user_agent, signature_data, signature_hash, pdf_storage_path, pdf_hash, pdf_generated_at, driver_snapshot, organization_snapshot, retention_expires_at, metadata, created_at) VALUES

-- ═══════════════════════════════════════════════════
-- ACME FREIGHT — signed consents (realistic history)
-- ═══════════════════════════════════════════════════

-- John Martinez — SIGNED 80 days ago
('c0000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000001',
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'signed', 'en', 'sms', '+12145559001',
 'tok_jm_001', NOW() - INTERVAL '79 days',
 (NOW() - INTERVAL '80 days')::date, NULL,
 NOW() - INTERVAL '80 days' + INTERVAL '2 minutes',
 NOW() - INTERVAL '80 days' + INTERVAL '5 minutes',
 NOW() - INTERVAL '80 days' + INTERVAL '8 minutes',
 '74.125.200.113'::inet, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ...',
 'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
 'consents/00000000-0000-0000-0000-000000000001/c0000000-0000-0000-0000-000000000001.pdf',
 'sha256:f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2',
 NOW() - INTERVAL '80 days' + INTERVAL '8 minutes',
 '{"first_name":"John","last_name":"Martinez","cdl_number":"TX-28491037","cdl_state":"TX","date_of_birth":"1985-03-15","phone":"+12145559001","email":"john.martinez@email.com"}'::jsonb,
 '{"name":"Acme Freight LLC","dot_number":"2847193","mc_number":"MC-584210","address":"4200 Interstate Blvd, Suite 300, Dallas, TX 75234"}'::jsonb,
 NOW() - INTERVAL '80 days' + INTERVAL '3 years',
 '{"source":"dashboard","template_id":"e0000000-0000-0000-0000-000000000001"}'::jsonb,
 NOW() - INTERVAL '80 days'),

-- Maria Garcia — SIGNED 75 days ago (Spanish)
('c0000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000002', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'signed', 'es', 'sms', '+12145559002',
 'tok_mg_002', NOW() - INTERVAL '74 days',
 (NOW() - INTERVAL '75 days')::date, NULL,
 NOW() - INTERVAL '75 days' + INTERVAL '1 minute',
 NOW() - INTERVAL '75 days' + INTERVAL '12 minutes',
 NOW() - INTERVAL '75 days' + INTERVAL '15 minutes',
 '172.58.100.42'::inet, 'Mozilla/5.0 (Linux; Android 14; SM-S918B)',
 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ...',
 'sha256:b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
 'consents/00000000-0000-0000-0000-000000000001/c0000000-0000-0000-0000-000000000002.pdf',
 'sha256:e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3',
 NOW() - INTERVAL '75 days' + INTERVAL '15 minutes',
 '{"first_name":"Maria","last_name":"Garcia","cdl_number":"CA-76321854","cdl_state":"CA","date_of_birth":"1990-07-22","phone":"+12145559002"}'::jsonb,
 '{"name":"Acme Freight LLC","dot_number":"2847193","mc_number":"MC-584210","address":"4200 Interstate Blvd, Suite 300, Dallas, TX 75234"}'::jsonb,
 NOW() - INTERVAL '75 days' + INTERVAL '3 years',
 '{"source":"dashboard","template_id":"e0000000-0000-0000-0000-000000000002"}'::jsonb,
 NOW() - INTERVAL '75 days'),

-- Robert Johnson — SIGNED 25 days ago
('c0000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000003', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'signed', 'en', 'sms', '+12145559003',
 'tok_rj_003', NOW() - INTERVAL '24 days',
 (NOW() - INTERVAL '25 days')::date, NULL,
 NOW() - INTERVAL '25 days' + INTERVAL '3 minutes',
 NOW() - INTERVAL '25 days' + INTERVAL '1 hour',
 NOW() - INTERVAL '25 days' + INTERVAL '1 hour 4 minutes',
 '98.45.72.188'::inet, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X)',
 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ...',
 'sha256:c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
 'consents/00000000-0000-0000-0000-000000000001/c0000000-0000-0000-0000-000000000003.pdf',
 'sha256:d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4',
 NOW() - INTERVAL '25 days' + INTERVAL '1 hour 4 minutes',
 '{"first_name":"Robert","last_name":"Johnson","cdl_number":"TX-59183724","cdl_state":"TX","date_of_birth":"1978-11-05","phone":"+12145559003","email":"rjohnson@email.com"}'::jsonb,
 '{"name":"Acme Freight LLC","dot_number":"2847193","mc_number":"MC-584210","address":"4200 Interstate Blvd, Suite 300, Dallas, TX 75234"}'::jsonb,
 NOW() - INTERVAL '25 days' + INTERVAL '3 years',
 '{"source":"dashboard","template_id":"e0000000-0000-0000-0000-000000000001"}'::jsonb,
 NOW() - INTERVAL '25 days'),

-- Carlos Rodriguez — SIGNED 70 days ago, pre-employment
('c0000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000004', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'pre_employment', 'signed', 'es', 'sms', '+12145559004',
 'tok_cr_004', NOW() - INTERVAL '69 days',
 (NOW() - INTERVAL '70 days')::date, (NOW() - INTERVAL '70 days')::date,
 NOW() - INTERVAL '70 days' + INTERVAL '5 minutes',
 NOW() - INTERVAL '70 days' + INTERVAL '20 minutes',
 NOW() - INTERVAL '70 days' + INTERVAL '22 minutes',
 '64.233.160.0'::inet, 'Mozilla/5.0 (Linux; Android 13; Pixel 7)',
 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ...',
 'sha256:d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
 'consents/00000000-0000-0000-0000-000000000001/c0000000-0000-0000-0000-000000000004.pdf',
 'sha256:c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5',
 NOW() - INTERVAL '70 days' + INTERVAL '22 minutes',
 '{"first_name":"Carlos","last_name":"Rodriguez","cdl_number":"AZ-41928376","cdl_state":"AZ","date_of_birth":"1992-01-30","phone":"+12145559004","email":"carlos.r@email.com"}'::jsonb,
 '{"name":"Acme Freight LLC","dot_number":"2847193","mc_number":"MC-584210","address":"4200 Interstate Blvd, Suite 300, Dallas, TX 75234"}'::jsonb,
 NOW() - INTERVAL '70 days' + INTERVAL '3 years',
 '{"source":"dashboard","template_id":"e0000000-0000-0000-0000-000000000003"}'::jsonb,
 NOW() - INTERVAL '70 days'),

-- Angela Thompson — OPENED but not yet signed (sent 2 days ago)
('c0000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000006', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'opened', 'en', 'sms', '+12145559006',
 'tok_at_005', NOW() + INTERVAL '5 days',
 CURRENT_DATE, NULL,
 NOW() - INTERVAL '2 days' + INTERVAL '1 minute',
 NOW() - INTERVAL '2 days' + INTERVAL '30 minutes',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 '{"first_name":"Angela","last_name":"Thompson","cdl_number":"TX-62847193","cdl_state":"TX","date_of_birth":"1993-04-18","phone":"+12145559006","email":"angela.t@email.com"}'::jsonb,
 '{"name":"Acme Freight LLC","dot_number":"2847193","mc_number":"MC-584210","address":"4200 Interstate Blvd, Suite 300, Dallas, TX 75234"}'::jsonb,
 NULL, '{}'::jsonb,
 NOW() - INTERVAL '2 days'),

-- Miguel Hernandez — SENT but not opened (sent 1 day ago)
('c0000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000007', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'sent', 'es', 'sms', '+12145559007',
 'tok_mh_006', NOW() + INTERVAL '6 days',
 CURRENT_DATE, NULL,
 NOW() - INTERVAL '1 day',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 '{"first_name":"Miguel","last_name":"Hernandez","cdl_number":"TX-95173824","cdl_state":"TX","date_of_birth":"1986-12-03","phone":"+12145559007"}'::jsonb,
 '{"name":"Acme Freight LLC","dot_number":"2847193","mc_number":"MC-584210","address":"4200 Interstate Blvd, Suite 300, Dallas, TX 75234"}'::jsonb,
 NULL, '{}'::jsonb,
 NOW() - INTERVAL '1 day'),

-- David Chen — PENDING (just created, not sent yet)
('c0000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000008', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'pending', 'en', 'sms', '+12145559008',
 'tok_dc_007', NOW() + INTERVAL '7 days',
 CURRENT_DATE, NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 '{"first_name":"David","last_name":"Chen","cdl_number":"TX-37284916","cdl_state":"TX","date_of_birth":"1991-08-27","phone":"+12145559008","email":"dchen@email.com"}'::jsonb,
 '{"name":"Acme Freight LLC","dot_number":"2847193","mc_number":"MC-584210","address":"4200 Interstate Blvd, Suite 300, Dallas, TX 75234"}'::jsonb,
 NULL, '{}'::jsonb,
 NOW() - INTERVAL '3 hours'),

-- Patricia Williams — EXPIRED (sent 10 days ago, token expired)
('c0000000-0000-0000-0000-000000000008',
 '00000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000009', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'expired', 'en', 'sms', '+12145559009',
 'tok_pw_008', NOW() - INTERVAL '3 days',
 (NOW() - INTERVAL '10 days')::date, NULL,
 NOW() - INTERVAL '10 days' + INTERVAL '2 minutes',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 '{"first_name":"Patricia","last_name":"Williams","cdl_number":"TX-14829375","cdl_state":"TX","date_of_birth":"1982-06-14","phone":"+12145559009","email":"p.williams@email.com"}'::jsonb,
 '{"name":"Acme Freight LLC","dot_number":"2847193","mc_number":"MC-584210","address":"4200 Interstate Blvd, Suite 300, Dallas, TX 75234"}'::jsonb,
 NULL, '{}'::jsonb,
 NOW() - INTERVAL '10 days'),

-- James Wilson — SIGNED 60 days ago, then REVOKED
('c0000000-0000-0000-0000-000000000009',
 '00000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000005', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'revoked', 'en', 'sms', '+12145559005',
 'tok_jw_009', NOW() - INTERVAL '53 days',
 (NOW() - INTERVAL '60 days')::date, (NOW() - INTERVAL '15 days')::date,
 NOW() - INTERVAL '60 days' + INTERVAL '4 minutes',
 NOW() - INTERVAL '60 days' + INTERVAL '45 minutes',
 NOW() - INTERVAL '60 days' + INTERVAL '48 minutes',
 '107.77.192.55'::inet, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X)',
 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ...',
 'sha256:e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
 'consents/00000000-0000-0000-0000-000000000001/c0000000-0000-0000-0000-000000000009.pdf',
 'sha256:b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6',
 NOW() - INTERVAL '60 days' + INTERVAL '48 minutes',
 '{"first_name":"James","last_name":"Wilson","cdl_number":"OK-83716254","cdl_state":"OK","date_of_birth":"1988-09-12","phone":"+12145559005"}'::jsonb,
 '{"name":"Acme Freight LLC","dot_number":"2847193","mc_number":"MC-584210","address":"4200 Interstate Blvd, Suite 300, Dallas, TX 75234"}'::jsonb,
 NOW() - INTERVAL '60 days' + INTERVAL '3 years',
 '{"revoked_at":"2026-02-09T00:00:00Z","revoked_reason":"Driver written request"}'::jsonb,
 NOW() - INTERVAL '60 days'),

-- ═══════════════════════════════════════════════════
-- SOUTHWEST HAULERS — mix of statuses
-- ═══════════════════════════════════════════════════

-- Lisa Morales — SIGNED 45 days ago
('c0000000-0000-0000-0000-000000000010',
 '00000000-0000-0000-0000-000000000002',
 'd0000000-0000-0000-0000-000000000011', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'signed', 'en', 'sms', '+16025559011',
 'tok_lm_010', NOW() - INTERVAL '44 days',
 (NOW() - INTERVAL '45 days')::date, NULL,
 NOW() - INTERVAL '45 days' + INTERVAL '1 minute',
 NOW() - INTERVAL '45 days' + INTERVAL '10 minutes',
 NOW() - INTERVAL '45 days' + INTERVAL '14 minutes',
 '209.85.238.100'::inet, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X)',
 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ...',
 'sha256:f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
 'consents/00000000-0000-0000-0000-000000000002/c0000000-0000-0000-0000-000000000010.pdf',
 'sha256:a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1',
 NOW() - INTERVAL '45 days' + INTERVAL '14 minutes',
 '{"first_name":"Lisa","last_name":"Morales","cdl_number":"AZ-48271639","cdl_state":"AZ","date_of_birth":"1987-05-20","phone":"+16025559011","email":"lisa.morales@email.com"}'::jsonb,
 '{"name":"Southwest Haulers Inc.","dot_number":"1593748","mc_number":"MC-291653","address":"780 Logistics Parkway, Phoenix, AZ 85034"}'::jsonb,
 NOW() - INTERVAL '45 days' + INTERVAL '3 years',
 '{}'::jsonb,
 NOW() - INTERVAL '45 days'),

-- Kevin Nguyen — DELIVERED (opened SMS but hasn't clicked link)
('c0000000-0000-0000-0000-000000000011',
 '00000000-0000-0000-0000-000000000002',
 'd0000000-0000-0000-0000-000000000012', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'delivered', 'en', 'sms', '+16025559012',
 'tok_kn_011', NOW() + INTERVAL '5 days',
 CURRENT_DATE, NULL,
 NOW() - INTERVAL '6 hours',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 '{"first_name":"Kevin","last_name":"Nguyen","cdl_number":"AZ-93715284","cdl_state":"AZ","date_of_birth":"1994-10-11","phone":"+16025559012","email":"knguyen@email.com"}'::jsonb,
 '{"name":"Southwest Haulers Inc.","dot_number":"1593748","mc_number":"MC-291653","address":"780 Logistics Parkway, Phoenix, AZ 85034"}'::jsonb,
 NULL, '{}'::jsonb,
 NOW() - INTERVAL '6 hours'),

-- Sandra Lopez — SIGNED 30 days ago (Spanish)
('c0000000-0000-0000-0000-000000000012',
 '00000000-0000-0000-0000-000000000002',
 'd0000000-0000-0000-0000-000000000013', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'signed', 'es', 'sms', '+16025559013',
 'tok_sl_012', NOW() - INTERVAL '29 days',
 (NOW() - INTERVAL '30 days')::date, NULL,
 NOW() - INTERVAL '30 days' + INTERVAL '2 minutes',
 NOW() - INTERVAL '30 days' + INTERVAL '3 hours',
 NOW() - INTERVAL '30 days' + INTERVAL '3 hours 6 minutes',
 '142.250.80.46'::inet, 'Mozilla/5.0 (Linux; Android 14; SM-A546B)',
 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ...',
 'sha256:a1c2e3b4d5f6a1c2e3b4d5f6a1c2e3b4d5f6a1c2e3b4d5f6a1c2e3b4d5f6a1c2',
 'consents/00000000-0000-0000-0000-000000000002/c0000000-0000-0000-0000-000000000012.pdf',
 'sha256:f1d2c3b4a5f1d2c3b4a5f1d2c3b4a5f1d2c3b4a5f1d2c3b4a5f1d2c3b4a5f1d2',
 NOW() - INTERVAL '30 days' + INTERVAL '3 hours 6 minutes',
 '{"first_name":"Sandra","last_name":"Lopez","cdl_number":"CA-26184739","cdl_state":"CA","date_of_birth":"1989-03-28","phone":"+16025559013"}'::jsonb,
 '{"name":"Southwest Haulers Inc.","dot_number":"1593748","mc_number":"MC-291653","address":"780 Logistics Parkway, Phoenix, AZ 85034"}'::jsonb,
 NOW() - INTERVAL '30 days' + INTERVAL '3 years',
 '{}'::jsonb,
 NOW() - INTERVAL '30 days'),

-- Rosa Gutierrez — FAILED delivery
('c0000000-0000-0000-0000-000000000013',
 '00000000-0000-0000-0000-000000000002',
 'd0000000-0000-0000-0000-000000000015', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'failed', 'es', 'sms', '+16025559015',
 'tok_rg_013', NOW() + INTERVAL '5 days',
 CURRENT_DATE, NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 '{"first_name":"Rosa","last_name":"Gutierrez","cdl_number":"AZ-84627193","cdl_state":"AZ","date_of_birth":"1996-01-25","phone":"+16025559015"}'::jsonb,
 '{"name":"Southwest Haulers Inc.","dot_number":"1593748","mc_number":"MC-291653","address":"780 Logistics Parkway, Phoenix, AZ 85034"}'::jsonb,
 NULL, '{"failure_reason":"Phone number unreachable"}'::jsonb,
 NOW() - INTERVAL '3 days'),

-- ═══════════════════════════════════════════════════
-- GREAT PLAINS — newer org, fewer consents
-- ═══════════════════════════════════════════════════

-- William Turner — SIGNED 20 days ago
('c0000000-0000-0000-0000-000000000014',
 '00000000-0000-0000-0000-000000000003',
 'd0000000-0000-0000-0000-000000000017', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'signed', 'en', 'sms', '+14055559017',
 'tok_wt_014', NOW() - INTERVAL '19 days',
 (NOW() - INTERVAL '20 days')::date, NULL,
 NOW() - INTERVAL '20 days' + INTERVAL '1 minute',
 NOW() - INTERVAL '20 days' + INTERVAL '15 minutes',
 NOW() - INTERVAL '20 days' + INTERVAL '18 minutes',
 '216.58.214.206'::inet, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ...',
 'sha256:b2d3f4a5c6b2d3f4a5c6b2d3f4a5c6b2d3f4a5c6b2d3f4a5c6b2d3f4a5c6b2d3',
 'consents/00000000-0000-0000-0000-000000000003/c0000000-0000-0000-0000-000000000014.pdf',
 'sha256:e2c3a4b5d6e2c3a4b5d6e2c3a4b5d6e2c3a4b5d6e2c3a4b5d6e2c3a4b5d6e2c3',
 NOW() - INTERVAL '20 days' + INTERVAL '18 minutes',
 '{"first_name":"William","last_name":"Turner","cdl_number":"OK-61839274","cdl_state":"OK","date_of_birth":"1984-08-05","phone":"+14055559017","email":"w.turner@email.com"}'::jsonb,
 '{"name":"Great Plains Transport Co.","dot_number":"3061582","mc_number":"MC-718394","address":"1100 Heartland Drive, Building C, Oklahoma City, OK 73112"}'::jsonb,
 NOW() - INTERVAL '20 days' + INTERVAL '3 years',
 '{}'::jsonb,
 NOW() - INTERVAL '20 days'),

-- Jennifer Scott — SENT 4 hours ago
('c0000000-0000-0000-0000-000000000015',
 '00000000-0000-0000-0000-000000000003',
 'd0000000-0000-0000-0000-000000000018', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'sent', 'en', 'sms', '+14055559018',
 'tok_js_015', NOW() + INTERVAL '7 days',
 CURRENT_DATE, NULL,
 NOW() - INTERVAL '4 hours',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 '{"first_name":"Jennifer","last_name":"Scott","cdl_number":"OK-27491638","cdl_state":"OK","date_of_birth":"1991-12-19","phone":"+14055559018","email":"j.scott@email.com"}'::jsonb,
 '{"name":"Great Plains Transport Co.","dot_number":"3061582","mc_number":"MC-718394","address":"1100 Heartland Drive, Building C, Oklahoma City, OK 73112"}'::jsonb,
 NULL, '{}'::jsonb,
 NOW() - INTERVAL '4 hours'),

-- Eduardo Reyes — OPENED just now
('c0000000-0000-0000-0000-000000000016',
 '00000000-0000-0000-0000-000000000003',
 'd0000000-0000-0000-0000-000000000019', 
 '84bd8eb2-d684-4771-8aff-f1e010cd73ed',
 'limited_query', 'opened', 'es', 'sms', '+14055559019',
 'tok_er_016', NOW() + INTERVAL '7 days',
 CURRENT_DATE, NULL,
 NOW() - INTERVAL '2 hours',
 NOW() - INTERVAL '15 minutes',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 '{"first_name":"Eduardo","last_name":"Reyes","cdl_number":"TX-58173926","cdl_state":"TX","date_of_birth":"1988-04-02","phone":"+14055559019"}'::jsonb,
 '{"name":"Great Plains Transport Co.","dot_number":"3061582","mc_number":"MC-718394","address":"1100 Heartland Drive, Building C, Oklahoma City, OK 73112"}'::jsonb,
 NULL, '{}'::jsonb,
 NOW() - INTERVAL '2 hours');


-- =============================================================================
-- NOTIFICATIONS (SMS delivery tracking)
-- =============================================================================

INSERT INTO public.notifications (id, organization_id, consent_id, type, channel, recipient, message_body, external_id, status, attempts, sent_at, delivered_at, created_at) VALUES

-- Acme Freight notifications
('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'consent_link', 'sms', '+12145559001', 'Acme Freight LLC needs your consent for an FMCSA Clearinghouse query. Sign here: https://consenthaul.com/sign/tok_jm_001', 'SM1a2b3c4d5e6f7g8h9i0j', 'delivered', 1, NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days' + INTERVAL '30 seconds', NOW() - INTERVAL '80 days'),
('f0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'signed_confirmation', 'sms', '+12145559001', 'Your FMCSA consent for Acme Freight LLC has been recorded. Reference: CNS-2026-00847', 'SM2b3c4d5e6f7g8h9i0j1k', 'delivered', 1, NOW() - INTERVAL '80 days' + INTERVAL '9 minutes', NOW() - INTERVAL '80 days' + INTERVAL '9 minutes 20 seconds', NOW() - INTERVAL '80 days' + INTERVAL '8 minutes'),

('f0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'consent_link', 'sms', '+12145559002', 'Acme Freight LLC necesita su consentimiento para una consulta de FMCSA Clearinghouse. Firme aquí: https://consenthaul.com/sign/tok_mg_002', 'SM3c4d5e6f7g8h9i0j1k2l', 'delivered', 1, NOW() - INTERVAL '75 days', NOW() - INTERVAL '75 days' + INTERVAL '25 seconds', NOW() - INTERVAL '75 days'),

('f0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'consent_link', 'sms', '+12145559006', 'Acme Freight LLC needs your consent for an FMCSA Clearinghouse query. Sign here: https://consenthaul.com/sign/tok_at_005', 'SM4d5e6f7g8h9i0j1k2l3m', 'delivered', 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 seconds', NOW() - INTERVAL '2 days'),
('f0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'reminder', 'sms', '+12145559006', 'Reminder: Your FMCSA consent for Acme Freight LLC is still pending. Sign here: https://consenthaul.com/sign/tok_at_005', 'SM5e6f7g8h9i0j1k2l3m4n', 'delivered', 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 seconds', NOW() - INTERVAL '1 day'),

('f0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'consent_link', 'sms', '+12145559007', 'Acme Freight LLC necesita su consentimiento para una consulta de FMCSA Clearinghouse. Firme aquí: https://consenthaul.com/sign/tok_mh_006', 'SM6f7g8h9i0j1k2l3m4n5o', 'sent', 1, NOW() - INTERVAL '1 day', NULL, NOW() - INTERVAL '1 day'),

('f0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'consent_link', 'sms', '+12145559009', 'Acme Freight LLC needs your consent for an FMCSA Clearinghouse query. Sign here: https://consenthaul.com/sign/tok_pw_008', 'SM7g8h9i0j1k2l3m4n5o6p', 'delivered', 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '35 seconds', NOW() - INTERVAL '10 days'),
('f0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'expiry_warning', 'sms', '+12145559009', 'Your FMCSA consent link for Acme Freight LLC expires tomorrow. Sign now: https://consenthaul.com/sign/tok_pw_008', 'SM8h9i0j1k2l3m4n5o6p7q', 'delivered', 1, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '40 seconds', NOW() - INTERVAL '4 days'),

-- Southwest Haulers notifications
('f0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000010', 'consent_link', 'sms', '+16025559011', 'Southwest Haulers Inc. needs your consent for an FMCSA Clearinghouse query. Sign here: https://consenthaul.com/sign/tok_lm_010', 'SM9i0j1k2l3m4n5o6p7q8r', 'delivered', 1, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days' + INTERVAL '20 seconds', NOW() - INTERVAL '45 days'),

('f0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000013', 'consent_link', 'sms', '+16025559015', 'Southwest Haulers Inc. necesita su consentimiento para una consulta de FMCSA Clearinghouse.', NULL, 'failed', 3, NULL, NULL, NOW() - INTERVAL '3 days'),

-- Great Plains notifications
('f0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000014', 'consent_link', 'sms', '+14055559017', 'Great Plains Transport Co. needs your consent for an FMCSA Clearinghouse query. Sign here: https://consenthaul.com/sign/tok_wt_014', 'SMa0j1k2l3m4n5o6p7q8r9', 'delivered', 1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '28 seconds', NOW() - INTERVAL '20 days'),

('f0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000015', 'consent_link', 'sms', '+14055559018', 'Great Plains Transport Co. needs your consent for an FMCSA Clearinghouse query. Sign here: https://consenthaul.com/sign/tok_js_015', 'SMb1k2l3m4n5o6p7q8r9s0', 'sent', 1, NOW() - INTERVAL '4 hours', NULL, NOW() - INTERVAL '4 hours'),

('f0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000016', 'consent_link', 'sms', '+14055559019', 'Great Plains Transport Co. necesita su consentimiento para una consulta de FMCSA Clearinghouse. Firme aquí: https://consenthaul.com/sign/tok_er_016', 'SMc2l3m4n5o6p7q8r9s0t1', 'delivered', 1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '22 seconds', NOW() - INTERVAL '2 hours');


-- =============================================================================
-- AUDIT LOG (compliance trail)
-- =============================================================================

INSERT INTO public.audit_log (organization_id, actor_type, action, resource_type, resource_id, details, created_at) VALUES

-- Acme Freight audit trail
('00000000-0000-0000-0000-000000000001', 'system', 'created', 'organization', '00000000-0000-0000-0000-000000000001', '{"name":"Acme Freight LLC"}'::jsonb, NOW() - INTERVAL '90 days'),
('00000000-0000-0000-0000-000000000001', 'system', 'credits_purchased', 'credit_balance', '00000000-0000-0000-0000-000000000001', '{"amount":50,"pack":"Standard Pack"}'::jsonb, NOW() - INTERVAL '85 days'),

('00000000-0000-0000-0000-000000000001', 'user', 'created', 'consent', 'c0000000-0000-0000-0000-000000000001', '{"driver":"John Martinez","type":"limited_query"}'::jsonb, NOW() - INTERVAL '80 days'),
('00000000-0000-0000-0000-000000000001', 'system', 'sent', 'consent', 'c0000000-0000-0000-0000-000000000001', '{"channel":"sms","recipient":"+12145559001"}'::jsonb, NOW() - INTERVAL '80 days'),
('00000000-0000-0000-0000-000000000001', 'system', 'delivered', 'consent', 'c0000000-0000-0000-0000-000000000001', '{"channel":"sms"}'::jsonb, NOW() - INTERVAL '80 days' + INTERVAL '30 seconds'),
('00000000-0000-0000-0000-000000000001', 'system', 'opened', 'consent', 'c0000000-0000-0000-0000-000000000001', '{"ip":"74.125.200.113"}'::jsonb, NOW() - INTERVAL '80 days' + INTERVAL '5 minutes'),
('00000000-0000-0000-0000-000000000001', 'system', 'signed', 'consent', 'c0000000-0000-0000-0000-000000000001', '{"ip":"74.125.200.113","user_agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)"}'::jsonb, NOW() - INTERVAL '80 days' + INTERVAL '8 minutes'),
('00000000-0000-0000-0000-000000000001', 'system', 'pdf_generated', 'consent', 'c0000000-0000-0000-0000-000000000001', '{"path":"consents/00000000-0000-0000-0000-000000000001/c0000000-0000-0000-0000-000000000001.pdf"}'::jsonb, NOW() - INTERVAL '80 days' + INTERVAL '8 minutes'),

('00000000-0000-0000-0000-000000000001', 'user', 'created', 'consent', 'c0000000-0000-0000-0000-000000000002', '{"driver":"Maria Garcia","type":"limited_query","language":"es"}'::jsonb, NOW() - INTERVAL '75 days'),
('00000000-0000-0000-0000-000000000001', 'system', 'signed', 'consent', 'c0000000-0000-0000-0000-000000000002', '{"ip":"172.58.100.42"}'::jsonb, NOW() - INTERVAL '75 days' + INTERVAL '15 minutes'),

('00000000-0000-0000-0000-000000000001', 'user', 'created', 'consent', 'c0000000-0000-0000-0000-000000000009', '{"driver":"James Wilson","type":"limited_query"}'::jsonb, NOW() - INTERVAL '60 days'),
('00000000-0000-0000-0000-000000000001', 'system', 'signed', 'consent', 'c0000000-0000-0000-0000-000000000009', '{"ip":"107.77.192.55"}'::jsonb, NOW() - INTERVAL '60 days' + INTERVAL '48 minutes'),
('00000000-0000-0000-0000-000000000001', 'user', 'revoked', 'consent', 'c0000000-0000-0000-0000-000000000009', '{"reason":"Driver written request"}'::jsonb, NOW() - INTERVAL '15 days'),

('00000000-0000-0000-0000-000000000001', 'user', 'created', 'driver', 'd0000000-0000-0000-0000-000000000006', '{"name":"Angela Thompson"}'::jsonb, NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000001', 'user', 'created', 'consent', 'c0000000-0000-0000-0000-000000000005', '{"driver":"Angela Thompson","type":"limited_query"}'::jsonb, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000001', 'system', 'opened', 'consent', 'c0000000-0000-0000-0000-000000000005', '{}'::jsonb, NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'),

('00000000-0000-0000-0000-000000000001', 'system', 'expired', 'consent', 'c0000000-0000-0000-0000-000000000008', '{"reason":"Signing token expired"}'::jsonb, NOW() - INTERVAL '3 days'),

-- Southwest Haulers audit trail
('00000000-0000-0000-0000-000000000002', 'system', 'created', 'organization', '00000000-0000-0000-0000-000000000002', '{"name":"Southwest Haulers Inc."}'::jsonb, NOW() - INTERVAL '60 days'),
('00000000-0000-0000-0000-000000000002', 'system', 'signed', 'consent', 'c0000000-0000-0000-0000-000000000010', '{"ip":"209.85.238.100"}'::jsonb, NOW() - INTERVAL '45 days' + INTERVAL '14 minutes'),
('00000000-0000-0000-0000-000000000002', 'system', 'failed', 'consent', 'c0000000-0000-0000-0000-000000000013', '{"reason":"Phone number unreachable","attempts":3}'::jsonb, NOW() - INTERVAL '3 days'),

-- Great Plains audit trail
('00000000-0000-0000-0000-000000000003', 'system', 'created', 'organization', '00000000-0000-0000-0000-000000000003', '{"name":"Great Plains Transport Co."}'::jsonb, NOW() - INTERVAL '45 days'),
('00000000-0000-0000-0000-000000000003', 'system', 'signed', 'consent', 'c0000000-0000-0000-0000-000000000014', '{"ip":"216.58.214.206"}'::jsonb, NOW() - INTERVAL '20 days' + INTERVAL '18 minutes'),
('00000000-0000-0000-0000-000000000003', 'system', 'opened', 'consent', 'c0000000-0000-0000-0000-000000000016', '{"ip":"client_ip"}'::jsonb, NOW() - INTERVAL '15 minutes');
