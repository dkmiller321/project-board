// Stripe webhook handler for syncing subscription data
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      // Product events - sync to products table
      case 'product.created':
      case 'product.updated': {
        const product = event.data.object as Stripe.Product;
        await upsertProduct(product);
        break;
      }
      case 'product.deleted': {
        const product = event.data.object as Stripe.Product;
        await deleteProduct(product.id);
        break;
      }

      // Price events - sync to prices table
      case 'price.created':
      case 'price.updated': {
        const price = event.data.object as Stripe.Price;
        await upsertPrice(price);
        break;
      }
      case 'price.deleted': {
        const price = event.data.object as Stripe.Price;
        await deletePrice(price.id);
        break;
      }

      // Checkout completed - create customer and subscription records
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      // Subscription events - sync subscription status
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscription(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await deleteSubscription(subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});

// Helper functions for database operations

async function upsertProduct(product: Stripe.Product) {
  const { error } = await supabaseAdmin.from('products').upsert({
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description,
    metadata: product.metadata,
  });

  if (error) {
    console.error('Error upserting product:', error);
    throw error;
  }
}

async function deleteProduct(productId: string) {
  const { error } = await supabaseAdmin
    .from('products')
    .update({ active: false })
    .eq('id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

async function upsertPrice(price: Stripe.Price) {
  const { error } = await supabaseAdmin.from('prices').upsert({
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : price.product.id,
    active: price.active,
    currency: price.currency,
    unit_amount: price.unit_amount,
    type: price.type,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
  });

  if (error) {
    console.error('Error upserting price:', error);
    throw error;
  }
}

async function deletePrice(priceId: string) {
  const { error } = await supabaseAdmin
    .from('prices')
    .update({ active: false })
    .eq('id', priceId);

  if (error) {
    console.error('Error deleting price:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !customerId) {
    console.error('Missing user ID or customer ID in checkout session');
    return;
  }

  // Create or update customer record
  const { error: customerError } = await supabaseAdmin.from('customers').upsert({
    id: userId,
    stripe_customer_id: customerId,
  });

  if (customerError) {
    console.error('Error upserting customer:', customerError);
    throw customerError;
  }

  // Fetch and sync subscription if present
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await upsertSubscription(subscription);
  }
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  // Get user ID from customer
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (customerError || !customer) {
    console.error('Customer not found for subscription:', customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;

  const { error } = await supabaseAdmin.from('subscriptions').upsert({
    id: subscription.id,
    user_id: customer.id,
    status: subscription.status as 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid',
    price_id: priceId,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }
}

async function deleteSubscription(subscriptionId: string) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .delete()
    .eq('id', subscriptionId);

  if (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
}
