import { useEffect, useState, useCallback } from 'react';
import { getTrackedOrders, TRACKED_ORDERS_STORAGE_KEY } from '../services/orderTracking';

/**
 * Lee la lista de órdenes persistidas en localStorage y se resincroniza:
 *   - al cambiar `storage` (otra pestaña escribió)
 *   - al emitir el evento custom `solution:trackedOrdersChanged` (misma pestaña)
 */
export function useTrackedOrders() {
  const [orders, setOrders] = useState(() => getTrackedOrders());

  const refresh = useCallback(() => {
    setOrders(getTrackedOrders());
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === null || e.key === TRACKED_ORDERS_STORAGE_KEY) refresh();
    };
    const onCustom = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener('solution:trackedOrdersChanged', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('solution:trackedOrdersChanged', onCustom);
    };
  }, [refresh]);

  return { orders, latest: orders[0] || null, refresh };
}

/** Dispara el evento custom para que los listeners en esta misma tab refresquen. */
export function notifyTrackedOrdersChanged() {
  try {
    window.dispatchEvent(new CustomEvent('solution:trackedOrdersChanged'));
  } catch {
    /* ignore */
  }
}
