import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type {
  Subscription,
  Usage,
  PlanTier,
  SubscriptionContextValue,
} from '../types/subscription';
import { FREE_TIER_LIMITS } from '../types/subscription';

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived state
  const isSubscribed = subscription?.status === 'active' || subscription?.status === 'trialing';
  const planTier: PlanTier = isSubscribed ? 'pro' : 'free';
  const cardsRemaining = planTier === 'free' && usage
    ? Math.max(0, FREE_TIER_LIMITS.maxCards - usage.cards_count)
    : null;
  const canAddCard = planTier === 'pro' || (cardsRemaining !== null && cardsRemaining > 0);

  // Fetch subscription and usage data
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const [subscriptionResult, usageResult] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('usage')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (subscriptionResult.error && subscriptionResult.error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subscriptionResult.error);
      }
      if (usageResult.error && usageResult.error.code !== 'PGRST116') {
        console.error('Error fetching usage:', usageResult.error);
      }

      setSubscription(subscriptionResult.data as Subscription | null);
      setUsage(usageResult.data as Usage | null);
      setLoading(false);
    };

    fetchData();

    // Set up realtime subscriptions
    const subscriptionChannel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newSub = payload.new as Subscription;
            if (newSub.status === 'active' || newSub.status === 'trialing') {
              setSubscription(newSub);
            } else {
              setSubscription(null);
            }
          } else if (payload.eventType === 'DELETE') {
            setSubscription(null);
          }
        }
      )
      .subscribe();

    const usageChannel = supabase
      .channel('usage-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usage',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setUsage(payload.new as Usage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
      supabase.removeChannel(usageChannel);
    };
  }, [user]);

  // Create checkout session
  const createCheckoutSession = useCallback(
    async (priceId: string): Promise<string> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            priceId,
            successUrl: `${window.location.origin}/settings?success=true`,
            cancelUrl: `${window.location.origin}/pricing?canceled=true`,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      return url;
    },
    [session]
  );

  // Create portal session
  const createPortalSession = useCallback(async (): Promise<string> => {
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings`,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  }, [session]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        usage,
        isSubscribed,
        planTier,
        canAddCard,
        cardsRemaining,
        loading,
        createCheckoutSession,
        createPortalSession,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
