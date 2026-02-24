-- Migration 009: Notification Queue
-- Track all outbound notifications (SMS, email, WhatsApp).

CREATE TYPE public.notification_status AS ENUM (
    'queued', 'sending', 'sent', 'delivered', 'failed', 'undeliverable'
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    consent_id UUID REFERENCES public.consents(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('consent_link', 'reminder', 'expiry_warning', 'signed_confirmation')),
    channel public.delivery_method NOT NULL,
    recipient TEXT NOT NULL,
    message_body TEXT,
    external_id TEXT,
    status public.notification_status NOT NULL DEFAULT 'queued',
    status_detail TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    next_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_consent ON public.notifications(consent_id);
CREATE INDEX idx_notifications_queue ON public.notifications(status, next_attempt_at)
    WHERE status IN ('queued', 'sending');
CREATE INDEX idx_notifications_external ON public.notifications(external_id);
