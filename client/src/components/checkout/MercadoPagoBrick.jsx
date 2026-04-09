import { useEffect, useRef, useId, useCallback } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { createMPOrder, setCheckoutPaymentProvider } from '../../services/checkout';

/**
 * Card Payment Brick — el monto debe coincidir con el total del checkout (productos + envío).
 */
export default function MercadoPagoBrick({
  amount,
  disabled,
  getCheckoutPayload,
  onSuccess,
  onError,
  onBrickReady,
}) {
  const reactId = useId().replace(/:/g, '');
  const containerId = `cardPaymentBrick_${reactId}`;
  const controllerRef = useRef(null);
  const publicKey = (import.meta.env.VITE_MP_PUBLIC_KEY || '').trim();

  const runSubmit = useCallback(
    async (formData, additionalData) => {
      const base = typeof getCheckoutPayload === 'function' ? getCheckoutPayload() : null;
      if (!base) {
        onError?.('Faltan datos del checkout.');
        throw new Error('Missing checkout payload');
      }

      setCheckoutPaymentProvider('mercadopago');

      const mp_payment = {
        token: formData.token,
        payment_method_id: formData.payment_method_id,
        payment_type_id: additionalData?.paymentTypeId || formData.payment_type_id,
        installments: formData.installments ?? 1,
        payer: formData.payer,
        transaction_amount: formData.transaction_amount,
      };

      let device_id;
      try {
        device_id =
          typeof window !== 'undefined' && window.MP_DEVICE_SESSION_ID
            ? String(window.MP_DEVICE_SESSION_ID)
            : undefined;
      } catch {
        device_id = undefined;
      }

      const payload = {
        ...base,
        mp_payment,
        ...(device_id ? { device_id } : {}),
      };

      const data = await createMPOrder(payload);
      const st = (data.order_status || '').toLowerCase();
      if (st === 'paid') {
        onSuccess?.(data);
        return;
      }
      if (st === 'payment_failed') {
        onError?.('El pago fue rechazado. Probá con otro medio o datos.');
        throw new Error('payment_failed');
      }
      onSuccess?.(data);
    },
    [getCheckoutPayload, onSuccess, onError],
  );

  useEffect(() => {
    if (!publicKey || disabled) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await loadMercadoPago();
      } catch (e) {
        console.error('[MP Brick] loadMercadoPago:', e);
        onError?.('No se pudo cargar Mercado Pago.');
        return;
      }
      if (cancelled) return;

      const mp = new window.MercadoPago(publicKey, { locale: 'es-AR' });
      const bricksBuilder = mp.bricks();

      try {
        controllerRef.current?.unmount?.();
        controllerRef.current = null;
      } catch {
        /* ignore */
      }

      const settings = {
        initialization: {
          amount: Number(amount) > 0 ? Number(amount) : 0,
        },
        customization: {
          visual: {
            style: {
              theme: 'dark',
            },
          },
        },
        callbacks: {
          onReady: () => onBrickReady?.(),
          onError: (error) => {
            console.error('[MP Brick] onError:', error);
            onError?.(error?.message || 'Error en el formulario de pago');
          },
          onSubmit: (cardFormData, additionalData) =>
            new Promise((resolve, reject) => {
              runSubmit(cardFormData, additionalData || {})
                .then(() => resolve())
                .catch(() => reject());
            }),
        },
      };

      try {
        const ctrl = await bricksBuilder.create('cardPayment', containerId, settings);
        if (cancelled) {
          ctrl?.unmount?.();
          return;
        }
        controllerRef.current = ctrl;
      } catch (e) {
        console.error('[MP Brick] create:', e);
        onError?.('No se pudo iniciar el checkout de Mercado Pago.');
      }
    })();

    return () => {
      cancelled = true;
      try {
        controllerRef.current?.unmount?.();
      } catch {
        /* ignore */
      }
      controllerRef.current = null;
    };
  }, [publicKey, disabled, amount, containerId, runSubmit, onError, onBrickReady]);

  if (!publicKey) {
    return (
      <div className="p-4 rounded-sm border border-amber-500/40 bg-amber-900/20 text-amber-200 text-sm">
        Falta <code className="text-amber-100">VITE_MP_PUBLIC_KEY</code> en el cliente. Agregala en{' '}
        <code className="text-amber-100">client/.env</code> y reiniciá Vite.
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="p-4 rounded-sm border border-white/10 bg-zinc-900/80 text-white/50 text-sm text-center">
        Completá envío y datos de contacto para habilitar el pago con Mercado Pago.
      </div>
    );
  }

  return (
    <div className="rounded-md overflow-hidden border border-white/10 bg-[#1a1a1a] p-2 sm:p-3">
      <div id={containerId} className="min-h-[280px]" />
      <p className="mt-2 text-[10px] text-white/35 text-center tracking-wide">
        Pagás de forma segura con Mercado Pago — los datos de tarjeta no pasan por nuestro servidor.
      </p>
    </div>
  );
}
