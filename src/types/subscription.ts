// Subscription-related types for Stripe integration

export type PlanTier = 'free' | 'pro';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid';

export type PriceInterval = 'month' | 'year';

export type PriceType = 'one_time' | 'recurring';

// Database types
export interface Customer {
  id: string; // user_id
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  active: boolean;
  name: string;
  description: string | null;
  metadata: Record<string, string>;
  created_at: string;
}

export interface Price {
  id: string;
  product_id: string;
  active: boolean;
  currency: string;
  unit_amount: number | null;
  type: PriceType;
  interval: PriceInterval | null;
  interval_count: number | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  price_id: string;
  cancel_at_period_end: boolean;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface Usage {
  user_id: string;
  cards_count: number;
  updated_at: string;
}

// Free tier limits
export const FREE_TIER_LIMITS = {
  maxCards: 20,
  maxBoards: 1,
  maxTeamMembers: 0,
} as const;

// Pro tier limits (unlimited represented as null)
export const PRO_TIER_LIMITS = {
  maxCards: null,
  maxBoards: null,
  maxTeamMembers: null,
} as const;

// Extended types for frontend use
export interface PriceWithProduct extends Price {
  product: Product;
}

export interface SubscriptionWithPrice extends Subscription {
  price: PriceWithProduct;
}

// Context value type
export interface SubscriptionContextValue {
  subscription: Subscription | null;
  usage: Usage | null;
  isSubscribed: boolean;
  planTier: PlanTier;
  canAddCard: boolean;
  cardsRemaining: number | null; // null means unlimited
  loading: boolean;
  createCheckoutSession: (priceId: string) => Promise<string>;
  createPortalSession: () => Promise<string>;
}
