import { useEffect, useRef } from 'react';

const PIXEL_ID = '1982545185676457';

/**
 * Llama a fbq('init') con los datos del comprador cuando el pago se confirma.
 *
 * Meta hashea automáticamente em y ph del lado del servidor cuando se pasan
 * en el segundo llamado a fbq('init'). Esto enriquece los eventos que ya
 * lleva el pixel (PageView, Purchase, etc.) con datos de usuario, mejorando
 * la tasa de match para atribución de campañas.
 *
 * El init estático de index.html permanece intacto; este segundo init
 * solo actualiza los user_data del pixel sin reiniciarlo.
 *
 * @param {object} opts
 * @param {string}  opts.email    — Email del comprador (se pasa en claro; Meta hashea)
 * @param {string}  [opts.phone]  — Teléfono (opcional)
 * @param {boolean} opts.enabled  — Debe ser true para disparar (ej: paymentResult === 'success')
 */
export function useMetaPixelIdentify({ email, phone, enabled }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (firedRef.current) return;
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;

    const em = (email || '').toLowerCase().trim();
    if (!em) return;

    firedRef.current = true;

    const userData = { em };
    const ph = (phone || '').replace(/\D/g, '');
    if (ph) userData.ph = ph;

    try {
      window.fbq('init', PIXEL_ID, userData);
    } catch (err) {
      // Silencioso: nunca debe interferir con el flujo de compra
      if (import.meta.env.DEV) console.warn('[MetaPixelIdentify] fbq init error:', err);
    }
  }, [enabled, email, phone]);
}
