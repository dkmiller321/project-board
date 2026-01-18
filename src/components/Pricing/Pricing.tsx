import { useState, useEffect } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { supabase } from '../../lib/supabase';
import type { Price, Product } from '../../types/subscription';
import { FREE_TIER_LIMITS } from '../../types/subscription';
import styles from './Pricing.module.css';

interface PriceWithProduct extends Price {
  product: Product;
}

interface PricingProps {
  onBack: () => void;
}

export function Pricing({ onBack }: PricingProps) {
  const { planTier, isSubscribed, createCheckoutSession } = useSubscription();
  const [prices, setPrices] = useState<PriceWithProduct[]>([]);
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select('*, product:products(*)')
        .eq('active', true)
        .eq('type', 'recurring')
        .order('unit_amount', { ascending: true });

      if (pricesError) {
        console.error('Error fetching prices:', pricesError);
        return;
      }

      setPrices(pricesData as unknown as PriceWithProduct[]);
    };

    fetchPrices();
  }, []);

  const handleSelectPlan = async (priceId: string) => {
    if (isSubscribed) return;

    setLoading(true);
    setError(null);

    try {
      const url = await createCheckoutSession(priceId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  };

  const monthlyPrice = prices.find((p) => p.interval === 'month');
  const yearlyPrice = prices.find((p) => p.interval === 'year');
  const selectedPrice = isYearly ? yearlyPrice : monthlyPrice;

  const formatPrice = (amount: number | null) => {
    if (amount === null) return '$0';
    return `$${(amount / 100).toFixed(0)}`;
  };

  const monthlyEquivalent = yearlyPrice?.unit_amount
    ? (yearlyPrice.unit_amount / 12 / 100).toFixed(0)
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Choose Your Plan</h1>
        <p className={styles.subtitle}>
          Unlock unlimited cards, boards, and team collaboration
        </p>
      </div>

      {monthlyPrice && yearlyPrice && (
        <div className={styles.toggleContainer}>
          <span
            className={`${styles.toggleLabel} ${!isYearly ? styles.toggleLabelActive : ''}`}
          >
            Monthly
          </span>
          <button
            type="button"
            className={`${styles.toggle} ${isYearly ? styles.toggleActive : ''}`}
            onClick={() => setIsYearly(!isYearly)}
          >
            <span className={styles.toggleHandle} />
          </button>
          <span
            className={`${styles.toggleLabel} ${isYearly ? styles.toggleLabelActive : ''}`}
          >
            Yearly
          </span>
          <span className={styles.savingsBadge}>Save 17%</span>
        </div>
      )}

      <div className={styles.plans}>
        {/* Free Plan */}
        <div className={styles.plan}>
          <h2 className={styles.planName}>Free</h2>
          <p className={styles.planDescription}>
            Perfect for getting started with personal projects
          </p>
          <div className={styles.priceContainer}>
            <span className={styles.price}>$0</span>
            <span className={styles.pricePeriod}>/month</span>
          </div>
          <ul className={styles.features}>
            <li className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              Up to {FREE_TIER_LIMITS.maxCards} cards
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              {FREE_TIER_LIMITS.maxBoards} project board
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIconMuted}>—</span>
              <span style={{ color: 'var(--color-text-muted)' }}>Team collaboration</span>
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIconMuted}>—</span>
              <span style={{ color: 'var(--color-text-muted)' }}>Advanced features</span>
            </li>
          </ul>
          <button
            type="button"
            className={`${styles.button} ${planTier === 'free' ? styles.currentPlan : styles.buttonOutline}`}
            disabled={planTier === 'free'}
          >
            {planTier === 'free' ? 'Current Plan' : 'Downgrade'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`${styles.plan} ${styles.planRecommended}`}>
          <span className={styles.badge}>Recommended</span>
          <h2 className={styles.planName}>Pro</h2>
          <p className={styles.planDescription}>
            For power users who need unlimited productivity
          </p>
          <div className={styles.priceContainer}>
            {isYearly && monthlyEquivalent ? (
              <>
                <span className={styles.price}>${monthlyEquivalent}</span>
                <span className={styles.pricePeriod}>/month</span>
                <p className={styles.billing}>
                  Billed {formatPrice(yearlyPrice?.unit_amount ?? null)} annually
                </p>
              </>
            ) : (
              <>
                <span className={styles.price}>
                  {formatPrice(monthlyPrice?.unit_amount ?? null)}
                </span>
                <span className={styles.pricePeriod}>/month</span>
                <p className={styles.billing}>Billed monthly</p>
              </>
            )}
          </div>
          <ul className={styles.features}>
            <li className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              Unlimited cards
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              Unlimited boards
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              Team collaboration
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              Advanced features
            </li>
          </ul>
          <button
            type="button"
            className={`${styles.button} ${planTier === 'pro' ? styles.currentPlan : ''}`}
            disabled={loading || planTier === 'pro' || !selectedPrice}
            onClick={() => selectedPrice && handleSelectPlan(selectedPrice.id)}
          >
            {planTier === 'pro'
              ? 'Current Plan'
              : loading
                ? 'Loading...'
                : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.backLink}>
        <button type="button" className={styles.backLinkButton} onClick={onBack}>
          ← Back to dashboard
        </button>
      </p>
    </div>
  );
}
