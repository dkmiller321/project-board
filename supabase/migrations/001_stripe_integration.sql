-- Stripe Integration Migration
-- Run this SQL in the Supabase SQL Editor

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Customers: Links Supabase users to Stripe customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products: Mirrors Stripe products (synced via webhook)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  active BOOLEAN DEFAULT TRUE,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prices: Mirrors Stripe prices
CREATE TABLE IF NOT EXISTS public.prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  currency TEXT NOT NULL,
  unit_amount INTEGER,
  type TEXT CHECK (type IN ('one_time', 'recurring')),
  interval TEXT CHECK (interval IN ('month', 'year')),
  interval_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions: User subscription status
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('trialing','active','canceled','past_due','unpaid')),
  price_id TEXT REFERENCES public.prices(id),
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage: Track resource counts for limit enforcement
CREATE TABLE IF NOT EXISTS public.usage (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  cards_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================

-- Customers: Users can read their own customer record
CREATE POLICY "Users read own customer" ON public.customers
  FOR SELECT USING (auth.uid() = id);

-- Products: Anyone can read active products
CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (active = TRUE);

-- Prices: Anyone can read active prices
CREATE POLICY "Public read prices" ON public.prices
  FOR SELECT USING (active = TRUE);

-- Subscriptions: Users can read their own subscriptions
CREATE POLICY "Users read own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Usage: Users can read their own usage
CREATE POLICY "Users read own usage" ON public.usage
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 4. ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage;

-- ============================================
-- 5. CREATE TRIGGERS FOR USAGE TRACKING
-- ============================================

-- Auto-create usage record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usage (user_id, cards_count) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_usage ON auth.users;

CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_usage();

-- Update cards_count on card changes
CREATE OR REPLACE FUNCTION public.update_cards_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.usage SET cards_count = cards_count + 1, updated_at = NOW() WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.usage SET cards_count = GREATEST(0, cards_count - 1), updated_at = NOW() WHERE user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_card_change ON public.cards;

CREATE TRIGGER on_card_change
  AFTER INSERT OR DELETE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.update_cards_count();

-- ============================================
-- 6. CREATE USAGE RECORDS FOR EXISTING USERS
-- ============================================

-- Insert usage records for any existing users who don't have one
INSERT INTO public.usage (user_id, cards_count)
SELECT u.id, COALESCE(c.count, 0)
FROM auth.users u
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM public.cards
  GROUP BY user_id
) c ON c.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.usage WHERE user_id = u.id
);

-- ============================================
-- SETUP INSTRUCTIONS
-- ============================================
--
-- After running this SQL:
--
-- 1. Set up Supabase Edge Function secrets:
--    supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
--    supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
--
-- 2. Deploy Edge Functions:
--    supabase functions deploy stripe-webhook
--    supabase functions deploy create-checkout-session
--    supabase functions deploy create-portal-session
--
-- 3. In Stripe Dashboard:
--    - Create Product: "Vibe Coder Pro" with metadata tier: pro
--    - Create Prices: $9/month, $90/year (recurring)
--    - Configure Webhook: https://<project>.supabase.co/functions/v1/stripe-webhook
--      Events: checkout.session.completed, customer.subscription.*, product.*, price.*
--    - Enable Customer Portal
--
-- 4. Add environment variable to your frontend:
--    VITE_SUPABASE_URL=https://<project>.supabase.co
