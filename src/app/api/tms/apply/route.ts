import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { partnerApplicationSchema } from '@/lib/validators';
import { partnerApplyLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import {
  TMS_PARTNER_PACKS,
  TMS_ONBOARDING_FEE_CENTS,
  TMS_SIGNUP_DISCOUNT,
  AUTO_CREATE_CARRIER_FEE_CENTS,
} from '@/lib/stripe/credits';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/tms/apply — Submit a partner application & create Stripe checkout
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const rl = partnerApplyLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = partnerApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const data = parsed.data;

    // Validate selected pack exists (optional — partners can skip pack selection)
    const pack = data.selected_pack_id
      ? TMS_PARTNER_PACKS.find((p) => p.id === data.selected_pack_id)
      : null;
    if (data.selected_pack_id && !pack) {
      return NextResponse.json(
        { error: 'Invalid credit pack selection' },
        { status: 400 },
      );
    }

    // Apply 25% signup discount to pack price when purchased during application
    const discountedPackPriceCents = pack
      ? Math.round(pack.price_cents * (1 - TMS_SIGNUP_DISCOUNT))
      : 0;

    // Calculate total
    const migrationFee = data.has_migration_data ? data.migration_fee_cents : 0;
    const autoCreateFee = data.auto_create_carriers ? AUTO_CREATE_CARRIER_FEE_CENTS : 0;
    const totalAmountCents =
      TMS_ONBOARDING_FEE_CENTS + discountedPackPriceCents + migrationFee + autoCreateFee;

    // Insert application
    const supabase = createAdminClient();
    const { data: application, error: insertError } = await supabase
      .from('partner_applications')
      .insert({
        company_name: data.company_name,
        website_url: data.website_url || null,
        employee_count_range: data.employee_count_range,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        partnership_reason: data.partnership_reason,
        tms_platform_name: data.tms_platform_name,
        carrier_count_range: data.carrier_count_range,
        consents_per_carrier_month: data.consents_per_carrier_month,
        estimated_annual_consents: data.estimated_annual_consents,
        recommended_pack_id: data.recommended_pack_id ?? null,
        has_migration_data: data.has_migration_data,
        migration_file_paths: data.migration_file_paths,
        migration_total_bytes: data.migration_total_bytes,
        migration_fee_cents: migrationFee,
        auto_create_carriers: data.auto_create_carriers,
        auto_create_fee_cents: autoCreateFee,
        selected_pack_id: pack?.id ?? '',
        selected_pack_credits: pack?.credits ?? 0,
        selected_pack_price_cents: discountedPackPriceCents,
        partner_agreement_accepted: data.partner_agreement_accepted,
        data_processing_accepted: data.data_processing_accepted,
        legal_signatory_name: data.legal_signatory_name,
        legal_accepted_at: new Date().toISOString(),
        onboarding_fee_cents: TMS_ONBOARDING_FEE_CENTS,
        total_amount_cents: totalAmountCents,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !application) {
      console.error('[POST /api/tms/apply] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    const appId = (application as { id: string }).id;

    // Build Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (TMS_ONBOARDING_FEE_CENTS > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Partner Onboarding Fee',
            description: 'One-time partner onboarding setup',
          },
          unit_amount: TMS_ONBOARDING_FEE_CENTS,
        },
        quantity: 1,
      });
    }

    if (pack) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pack.name} Credit Pack — ${pack.credits.toLocaleString()} consents (25% signup discount)`,
            description: `${pack.per_consent}/consent — ${pack.description}`,
          },
          unit_amount: discountedPackPriceCents,
        },
        quantity: 1,
      });
    }

    if (migrationFee > 0) {
      const totalGB = Math.ceil((data.migration_total_bytes || 0) / (1024 * 1024 * 1024));
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Data Migration',
            description: `${totalGB || 1} GB data migration & import`,
          },
          unit_amount: migrationFee,
        },
        quantity: 1,
      });
    }

    if (autoCreateFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Auto-Create Carrier Sub-Organizations',
            description: 'Automated carrier org provisioning from migration data',
          },
          unit_amount: AUTO_CREATE_CARRIER_FEE_CENTS,
        },
        quantity: 1,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    // If total is $0 (free onboarding, no pack, no migration), skip Stripe
    if (totalAmountCents === 0) {
      await supabase
        .from('partner_applications')
        .update({ status: 'paid' })
        .eq('id', appId);

      return NextResponse.json({
        checkout_url: `${appUrl}/tms/apply/success?app_id=${appId}`,
      });
    }

    // Create Stripe checkout session
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: data.contact_email,
      line_items: lineItems,
      metadata: {
        type: 'tms_partner_application',
        partner_application_id: appId,
      },
      success_url: `${appUrl}/tms/apply/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/tms/apply?cancelled=true`,
    });

    // Store checkout session ID on the application
    await supabase
      .from('partner_applications')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', appId);

    return NextResponse.json({ checkout_url: session.url });
  } catch (err) {
    console.error('[POST /api/tms/apply]', err);

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Payment Error', message: err.message },
        { status: 502 },
      );
    }

    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
