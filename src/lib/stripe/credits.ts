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
    price_cents: 1500,
    stripe_price_id: process.env.STRIPE_PRICE_STARTER!,
    label: '10 Credits',
    description: '$1.50 per consent — great for trying out ConsentHaul',
    popular: false,
  },
  {
    id: 'pack_50',
    credits: 50,
    price_cents: 5000,
    stripe_price_id: process.env.STRIPE_PRICE_STANDARD!,
    label: '50 Credits',
    description: '$1.00 per consent — most popular for small fleets',
    popular: true,
  },
  {
    id: 'pack_200',
    credits: 200,
    price_cents: 15000,
    stripe_price_id: process.env.STRIPE_PRICE_BULK!,
    label: '200 Credits',
    description: '$0.75 per consent — best value for growing fleets',
    popular: false,
  },
  {
    id: 'pack_1000',
    credits: 1000,
    price_cents: 50000,
    stripe_price_id: process.env.STRIPE_PRICE_ENTERPRISE!,
    label: '1,000 Credits',
    description: '$0.50 per consent — enterprise volume pricing',
    popular: false,
  },
];

/** Number of free credits granted to every new organization on sign-up */
export const SIGNUP_BONUS_CREDITS = 3;
