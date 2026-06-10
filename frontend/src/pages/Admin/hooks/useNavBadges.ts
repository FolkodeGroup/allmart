import { useState, useEffect, useCallback } from 'react';
import { useAdminOrders } from '../../../context/AdminOrdersContext';
import { useAdminProducts } from '../../../context/useAdminProductsContext';
import { useAdminContact } from '../../../context/AdminContactContext';
import { getOutOfStockAlertCount } from '../../../features/admin/outOfStockAlerts/services/outOfStockAlertsService';

type NavBadge = 'pending' | 'lowStock' | 'outOfStock' | 'unreadContacts' | null;

export function useNavBadges() {
  const { getPendingOrdersCount } = useAdminOrders();
  const { getLowStockCount } = useAdminProducts();
  const { getUnreadContactsCount } = useAdminContact();
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  // Out of stock alerts count
  useEffect(() => {
    const loadOutOfStockCount = async () => {
      try {
        const count = await getOutOfStockAlertCount();
        setOutOfStockCount(count);
      } catch (error) {
        console.error('Error loading out of stock count:', error);
      }
    };

    loadOutOfStockCount();
    // Reload every 30 seconds
    const interval = setInterval(loadOutOfStockCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBadgeCount = useCallback((badge: NavBadge) => {
    if (badge === 'pending') return getPendingOrdersCount();
    if (badge === 'lowStock') return getLowStockCount();
    if (badge === 'outOfStock') return outOfStockCount;
    if (badge === 'unreadContacts') return getUnreadContactsCount();
    return null;
  }, [getPendingOrdersCount, getLowStockCount, getUnreadContactsCount, outOfStockCount]);

  return { getBadgeCount, outOfStockCount };
}
