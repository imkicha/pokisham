import { useState, useEffect, useCallback } from 'react';

const HIDE_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Custom hook to manage badge visibility with a 15-minute cooldown after viewing
 * @param {string} badgeKey - Unique key for storing in localStorage (e.g., 'newProductBadge', 'offerBadge')
 * @returns {object} - { shouldShowBadge, markAsViewed }
 */
const useBadgeVisibility = (badgeKey) => {
  const [shouldShowBadge, setShouldShowBadge] = useState(false);

  // Check if badge should be visible based on last viewed time
  const checkVisibility = useCallback(() => {
    const storageKey = `badge_viewed_${badgeKey}`;
    const lastViewedTime = localStorage.getItem(storageKey);

    if (!lastViewedTime) {
      // Never viewed before - show badge
      setShouldShowBadge(true);
      return;
    }

    const timeSinceViewed = Date.now() - parseInt(lastViewedTime, 10);

    if (timeSinceViewed >= HIDE_DURATION_MS) {
      // 15 minutes have passed - show badge again
      setShouldShowBadge(true);
    } else {
      // Still within 15-minute cooldown - hide badge
      setShouldShowBadge(false);

      // Set a timeout to show badge when cooldown expires
      const remainingTime = HIDE_DURATION_MS - timeSinceViewed;
      const timeoutId = setTimeout(() => {
        setShouldShowBadge(true);
      }, remainingTime);

      return () => clearTimeout(timeoutId);
    }
  }, [badgeKey]);

  // Check visibility on mount and set up interval
  useEffect(() => {
    const cleanup = checkVisibility();
    return cleanup;
  }, [checkVisibility]);

  // Mark badge as viewed (called when user clicks/opens the badge)
  const markAsViewed = useCallback(() => {
    const storageKey = `badge_viewed_${badgeKey}`;
    localStorage.setItem(storageKey, Date.now().toString());
    setShouldShowBadge(false);

    // Set timeout to show badge again after 15 minutes
    setTimeout(() => {
      setShouldShowBadge(true);
    }, HIDE_DURATION_MS);
  }, [badgeKey]);

  return { shouldShowBadge, markAsViewed };
};

export default useBadgeVisibility;
