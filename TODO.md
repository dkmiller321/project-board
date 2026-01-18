# Stripe Integration - Setup Checklist

## Current State

The Stripe integration code is complete and the database schema has been applied. The following is implemented:

### Frontend
- [x] Subscription types and FREE_TIER_LIMITS constants
- [x] SubscriptionContext for managing subscription state
- [x] Pricing page with monthly/yearly toggle
- [x] Settings page with subscription management
- [x] UsageIndicator component in header
- [x] Card limit enforcement in Column component
- [x] Routing between dashboard, pricing, and settings

### Backend (Supabase)
- [x] Database tables: customers, products, prices, subscriptions, usage
- [x] Row Level Security policies
- [x] Realtime enabled for subscriptions and usage tables
- [x] Triggers for automatic usage tracking
- [x] Edge Functions created (not yet deployed):
  - `stripe-webhook` - Handles Stripe webhook events
  - `create-checkout-session` - Creates Stripe Checkout sessions
  - `create-portal-session` - Creates Customer Portal sessions

---

## Remaining Setup Tasks

### 1. Set Supabase Edge Function Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
```

### 3. Stripe Dashboard Configuration

1. **Create Product**
   - Name: "Vibe Coder Pro"
   - Add metadata: `tier: pro`

2. **Create Prices**
   - Monthly: $9/month (recurring)
   - Yearly: $90/year (recurring)

3. **Configure Webhook**
   - URL: `https://<your-project>.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `product.created`
     - `product.updated`
     - `product.deleted`
     - `price.created`
     - `price.updated`
     - `price.deleted`

4. **Enable Customer Portal**
   - Go to Settings → Billing → Customer Portal
   - Enable subscription cancellation
   - Enable payment method updates

---

## Testing Checklist

- [ ] Free user can create up to 20 cards
- [ ] Free user sees "Card limit reached" after 20 cards
- [ ] Free user can navigate to Pricing page
- [ ] Checkout flow works with test card (4242 4242 4242 4242)
- [ ] After payment, user is redirected to Settings with success message
- [ ] Pro user can create unlimited cards
- [ ] Pro user sees "Pro" badge in header
- [ ] "Manage Subscription" opens Stripe Customer Portal
- [ ] Canceling subscription updates status in real-time
- [ ] Webhook correctly syncs subscription status changes

---

## Test Card Numbers

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 3220 | 3D Secure authentication |

Use any future expiry date and any 3-digit CVC.
