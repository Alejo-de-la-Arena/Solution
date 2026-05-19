import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SOUND_URL = '/sounds/new-order.mp3';

function playDing() {
  try {
    const audio = new Audio(SOUND_URL);
    audio.volume = 0.7;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        if (err?.name !== 'NotAllowedError') console.warn('[realtime] audio play:', err);
      });
    }
  } catch (err) {
    console.warn('[realtime] audio init:', err);
  }
}

function showBrowserNotification(orderId, total, currency) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  const shortId = String(orderId || '').slice(0, 8);
  const money = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'ARS',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(total) || 0);
  try {
    new Notification('Nueva venta confirmada', {
      body: `#${shortId} — ${money}`,
      tag: `order-${orderId}`,
    });
  } catch (err) {
    console.warn('[realtime] Notification:', err);
  }
}

/**
 * Se suscribe a UPDATEs en la tabla `orders` y dispara una notificación
 * (ding + browser Notification + contador) cuando una orden pasa a `paid`.
 *
 * @param {{ onNewSale?: () => void }} [opts]
 * @returns {{ newOrdersCount: number, clearCount: () => void }}
 */
export function useNewOrdersRealtime({ onNewSale } = {}) {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const onNewSaleRef = useRef(onNewSale);
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    onNewSaleRef.current = onNewSale;
  }, [onNewSale]);

  const clearCount = useCallback(() => {
    setNewOrdersCount(0);
    seenIdsRef.current.clear();
  }, []);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }

    const channel = supabase
      .channel('admin-orders-paid')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const oldStatus = payload?.old?.status;
          const newStatus = payload?.new?.status;
          const orderId = payload?.new?.id;
          if (newStatus !== 'paid' || oldStatus === 'paid') return;
          if (!orderId || seenIdsRef.current.has(orderId)) return;
          seenIdsRef.current.add(orderId);

          playDing();
          showBrowserNotification(orderId, payload.new.total, payload.new.currency);
          setNewOrdersCount((n) => n + 1);
          if (typeof onNewSaleRef.current === 'function') {
            try { onNewSaleRef.current(); } catch (err) { console.warn('[realtime] onNewSale:', err); }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { newOrdersCount, clearCount };
}
