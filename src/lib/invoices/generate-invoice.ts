import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, InvoiceStatus, Json } from '@/types/database';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

interface LineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

interface GenerateInvoiceParams {
  organizationId: string;
  amountCents: number;
  description: string;
  lineItems: LineItem[];
  stripePaymentIntentId?: string;
  billingEmail?: string;
  billingName?: string;
}

/**
 * Generate an invoice record in the database.
 *
 * - Invoice number format: INV-YYYYMMDD-XXXX (date + random alphanumeric suffix)
 * - Status is set to 'paid' when a Stripe payment intent ID is provided, otherwise 'open'.
 */
export async function generateInvoice(params: GenerateInvoiceParams): Promise<InvoiceRow> {
  const supabase = createAdminClient();

  // Generate invoice number: INV-YYYYMMDD-XXXX
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const invoiceNumber = `INV-${dateStr}-${random}`;

  const totalCents = params.amountCents;
  const status: InvoiceStatus = params.stripePaymentIntentId ? 'paid' : 'open';

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: params.organizationId,
      invoice_number: invoiceNumber,
      stripe_payment_intent_id: params.stripePaymentIntentId ?? null,
      amount_cents: params.amountCents,
      tax_cents: 0,
      total_cents: totalCents,
      status,
      description: params.description,
      line_items: params.lineItems as unknown as Json,
      billing_email: params.billingEmail ?? null,
      billing_name: params.billingName ?? null,
      paid_at: params.stripePaymentIntentId ? now.toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as InvoiceRow;
}
