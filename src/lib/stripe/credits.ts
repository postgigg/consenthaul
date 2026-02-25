// ---------------------------------------------------------------------------
// Credit pack definitions & signup bonus
// ---------------------------------------------------------------------------

export interface CreditPack {
  /** Unique identifier used in checkout flow */
  id: string;
  /** Number of consent credits included */
  credits: number;
  /** Total price in US cents */
  price_cents: number;
  /** Stripe Price ID (configured per environment) */
  stripe_price_id: string;
  /** Short display label (e.g. "10 Credits") */
  label: string;
  /** Descriptive text shown under the label */
  description: string;
  /** Whether to highlight this pack as the best value */
  popular: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_10',
    credits: 10,
    price_cents: 3000,
    stripe_price_id: process.env.STRIPE_PRICE_STARTER!,
    label: '10 Credits',
    description: '$3.00 per consent — great for trying out ConsentHaul',
    popular: false,
  },
  {
    id: 'pack_50',
    credits: 50,
    price_cents: 12500,
    stripe_price_id: process.env.STRIPE_PRICE_STANDARD!,
    label: '50 Credits',
    description: '$2.50 per consent — most popular for small fleets',
    popular: true,
  },
  {
    id: 'pack_200',
    credits: 200,
    price_cents: 40000,
    stripe_price_id: process.env.STRIPE_PRICE_BULK!,
    label: '200 Credits',
    description: '$2.00 per consent — best value for growing fleets',
    popular: false,
  },
  {
    id: 'pack_1000',
    credits: 1000,
    price_cents: 150000,
    stripe_price_id: process.env.STRIPE_PRICE_ENTERPRISE!,
    label: '1,000 Credits',
    description: '$1.50 per consent — enterprise volume pricing',
    popular: false,
  },
];

/** Number of free credits granted to every new organization on sign-up */
export const SIGNUP_BONUS_CREDITS = 3;

// ---------------------------------------------------------------------------
// TMS Partner credit packs & fees
// ---------------------------------------------------------------------------

export interface TmsPartnerPack {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  per_consent: string;
  description: string;
}

export const TMS_PARTNER_PACKS: TmsPartnerPack[] = [
  {
    id: 'tms_starter',
    name: 'Starter',
    credits: 10_000,
    price_cents: 1_000_000,
    per_consent: '$1.00',
    description: 'For TMS platforms onboarding their first carriers',
  },
  {
    id: 'tms_growth',
    name: 'Growth',
    credits: 100_000,
    price_cents: 7_500_000,
    per_consent: '$0.75',
    description: 'For growing platforms with 100+ carriers',
  },
  {
    id: 'tms_scale',
    name: 'Scale',
    credits: 250_000,
    price_cents: 12_500_000,
    per_consent: '$0.50',
    description: 'Best value for established TMS platforms',
  },
  {
    id: 'tms_enterprise',
    name: 'Enterprise',
    credits: 500_000,
    price_cents: 14_500_000,
    per_consent: '$0.29',
    description: 'Maximum volume — lowest per-consent cost',
  },
];

/** One-time partner onboarding fee: $5,000 (includes 40hrs specialist + 15hrs custom dev) */
export const TMS_ONBOARDING_FEE_CENTS = 500_000;

/** Data migration fee per GB: $17/GB */
export const MIGRATION_PRICE_PER_GB_CENTS = 1700;

/** Flat fee to auto-create carrier sub-organizations: $500 */
export const AUTO_CREATE_CARRIER_FEE_CENTS = 50_000;
