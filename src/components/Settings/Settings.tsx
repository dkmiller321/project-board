import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { FREE_TIER_LIMITS } from '../../types/subscription';
import styles from './Settings.module.css';

interface SettingsProps {
  onBack: () => void;
  onNavigatePricing: () => void;
  showSuccessMessage?: boolean;
}

export function Settings({ onBack, onNavigatePricing, showSuccessMessage }: SettingsProps) {
  const { user, signOut } = useAuth();
  const {
    subscription,
    usage,
    planTier,
    isSubscribed,
    cardsRemaining,
    createPortalSession,
  } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const usagePercentage = usage
    ? Math.min(100, (usage.cards_count / FREE_TIER_LIMITS.maxCards) * 100)
    : 0;

  const getUsageBarClass = () => {
    if (usagePercentage >= 100) return styles.usageProgressDanger;
    if (usagePercentage >= 80) return styles.usageProgressWarning;
    return '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.backLink}>
          <button type="button" className={styles.backLinkButton} onClick={onBack}>
            ← Back to dashboard
          </button>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your account and subscription</p>
        </div>

        {showSuccessMessage && (
          <div className={styles.success}>
            Your subscription has been activated. Welcome to Pro!
          </div>
        )}

        {/* Subscription Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Subscription</h2>

          <div className={styles.planInfo}>
            <div className={styles.planBadge}>
              <span className={styles.planName}>
                {planTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </span>
              <span
                className={`${styles.statusBadge} ${
                  subscription?.status === 'active' || subscription?.status === 'trialing'
                    ? styles.statusActive
                    : subscription?.cancel_at_period_end
                      ? styles.statusCanceled
                      : styles.statusFree
                }`}
              >
                {subscription?.cancel_at_period_end
                  ? 'Canceling'
                  : subscription?.status === 'trialing'
                    ? 'Trial'
                    : subscription?.status === 'active'
                      ? 'Active'
                      : 'Free'}
              </span>
            </div>
          </div>

          {isSubscribed && subscription && (
            <p className={styles.planDetails}>
              {subscription.cancel_at_period_end
                ? `Access until ${formatDate(subscription.current_period_end)}`
                : `Renews on ${formatDate(subscription.current_period_end)}`}
            </p>
          )}

          {!isSubscribed && usage && (
            <>
              <div className={styles.usageBar}>
                <div
                  className={`${styles.usageProgress} ${getUsageBarClass()}`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className={styles.usageText}>
                <span>
                  {usage.cards_count} / {FREE_TIER_LIMITS.maxCards} cards used
                </span>
                <span>
                  {cardsRemaining !== null && cardsRemaining > 0
                    ? `${cardsRemaining} remaining`
                    : 'Limit reached'}
                </span>
              </div>
            </>
          )}

          <div className={styles.buttonGroup}>
            {isSubscribed ? (
              <button
                type="button"
                className={`${styles.button} ${styles.buttonOutline}`}
                onClick={handleManageSubscription}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.button}
                onClick={onNavigatePricing}
              >
                Upgrade to Pro
              </button>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        {/* Account Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>

          <div className={styles.accountInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>User ID</span>
              <span className={styles.infoValue}>
                {user?.id.slice(0, 8)}...{user?.id.slice(-4)}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Member since</span>
              <span className={styles.infoValue}>
                {user?.created_at ? formatDate(user.created_at) : 'N/A'}
              </span>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonDanger}`}
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
