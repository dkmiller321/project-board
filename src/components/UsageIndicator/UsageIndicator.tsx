import { useSubscription } from '../../context/SubscriptionContext';
import { FREE_TIER_LIMITS } from '../../types/subscription';
import styles from './UsageIndicator.module.css';

interface UsageIndicatorProps {
  onUpgradeClick: () => void;
}

export function UsageIndicator({ onUpgradeClick }: UsageIndicatorProps) {
  const { planTier, usage, cardsRemaining } = useSubscription();

  if (planTier === 'pro') {
    return (
      <div className={styles.container}>
        <span className={styles.proBadge}>
          <span className={styles.proIcon}>★</span>
          Pro
        </span>
      </div>
    );
  }

  const cardsUsed = usage?.cards_count ?? 0;
  const percentUsed = (cardsUsed / FREE_TIER_LIMITS.maxCards) * 100;

  const getCountClass = () => {
    if (percentUsed >= 100) return styles.countDanger;
    if (percentUsed >= 80) return styles.countWarning;
    return '';
  };

  return (
    <div className={styles.container}>
      <span className={styles.text}>Cards:</span>
      <span className={`${styles.count} ${getCountClass()}`}>
        {cardsUsed}/{FREE_TIER_LIMITS.maxCards}
      </span>
      {cardsRemaining !== null && cardsRemaining <= 5 && (
        <button
          type="button"
          className={styles.upgradeButton}
          onClick={onUpgradeClick}
        >
          Upgrade
        </button>
      )}
    </div>
  );
}
