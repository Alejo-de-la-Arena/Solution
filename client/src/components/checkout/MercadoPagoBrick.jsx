import { useEffect, useRef, useId, useState } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { createMPPreference, processMPCardPayment, setCheckoutPaymentProvider } from '../../services/checkout';

/**
 * Payment Brick — soporta tarjeta de crédito/débito + dinero en cuenta (wallet).
 * Crea una preferencia MP (+ orden DB) al activarse, luego renderiza el brick.
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
  const containerId = `paymentBrick_${reactId}`;
  const controllerRef = useRef(null);
  const publicKey = (import.meta.env.VITE_MP_PUBLIC_KEY || '').trim();

  const [prefData, setPrefData] = useState(null);
  const [prefLoading, setPrefLoading] = useState(false);

  const getCheckoutPayloadRef = useRef(getCheckoutPayload);
  getCheckoutPayloadRef.current = getCheckoutPayload;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onBrickReadyRef = useRef(onBrickReady);
  onBrickReadyRef.current = onBrickReady;
  const prefDataRef = useRef(prefData);
  prefDataRef.current = prefData;

  useEffect(() => {
    if (disabled || !publicKey || !(Number(amount) > 0)) {
      setPrefData(null);
      return;
    }

    let cancelled = false;

    const base = typeof getCheckoutPayloadRef.current === 'function'
      ? getCheckoutPayloadRef.current()
      : null;
    if (!base?.customer_name || !base?.customer_email) {
      setPrefData(null);
      return;
    }

    setPrefLoading(true);

    createMPPreference({
      ...base,
      callback_url: `${window.location.origin}/checkout`,
    })
      .then((data) => {
        if (cancelled) return;
        if (!data?.preference_id) {
          console.error('[MP Brick] Preferencia sin ID:', data);
          onErrorRef.current?.('No se pudo preparar el pago con Mercado Pago. Intentá de nuevo.');
          return;
        }
        setPrefData(data);
        setCheckoutPaymentProvider('mercadopago');
      })
      .catch((err) => {
        if (!cancelled) onErrorRef.current?.(err.message);
      })
      .then((data) => {
        if (!cancelled) {
          setPrefData(data);
          setCheckoutPaymentProvider('mercadopago');
        }
      })
      .catch((err) => {
        if (!cancelled) onErrorRef.current?.(err.message);
      })
      .finally(() => {
        if (!cancelled) setPrefLoading(false);
      });

    return () => { cancelled = true; };
  }, [disabled, publicKey, amount]);

  useEffect(() => {
    if (!publicKey || disabled || !prefData) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await loadMercadoPago();
      } catch (e) {
        console.error('[MP Brick] loadMercadoPago:', e);
        onErrorRef.current?.('No se pudo cargar Mercado Pago.');
        return;
      }
      if (cancelled) return;

      const mp = new window.MercadoPago(publicKey, { locale: 'es-AR' });
      const bricksBuilder = mp.bricks();

      try {
        controllerRef.current?.unmount?.();
        controllerRef.current = null;
      } catch { /* ignore */ }

      const settings = {
        initialization: {
          amount: Number(amount) > 0 ? Number(amount) : 0,
          // preferenceId: prefData.preference_id || undefined,
        },
        customization: {
          visual: {
            style: { theme: 'dark' },
          },
        },
        callbacks: {
          onReady: () => onBrickReadyRef.current?.(),

          onError: (error) => {
            if (error?.type === 'non_critical') {
              console.warn('[MP Brick] non-critical:', error.message);
              return;
            }
            console.error('[MP Brick] onError:', error);
            onErrorRef.current?.(error?.message || 'Error en el formulario de pago');
          },

          onSubmit: async (submittedData) => {
            const formData = submittedData?.formData || submittedData;
            const selectedPaymentMethod =
              submittedData?.selectedPaymentMethod
              || formData?.payment_type_id
              || '';

            if (selectedPaymentMethod === 'wallet_purchase') return;

            const currentPref = prefDataRef.current;
            if (!currentPref?.order_id) {
              onErrorRef.current?.('Error interno: orden no encontrada.');
              throw new Error('missing_order_id');
            }

            try {
              const mp_payment = {
                token: formData.token,
                payment_method_id: formData.payment_method_id,
                // Payment Brick puede enviar selectedPaymentMethod con valores de UI
                // (ej: "new_card") que NO son válidos para Orders API.
                payment_type_id: formData.payment_type_id || formData.paymentTypeId,
                installments: formData.installments ?? 1,
                payer: formData.payer,
                transaction_amount: formData.transaction_amount,
              };

              let device_id;
              try {
                device_id = typeof window !== 'undefined' && window.MP_DEVICE_SESSION_ID
                  ? String(window.MP_DEVICE_SESSION_ID)
                  : undefined;
              } catch { device_id = undefined; }

              const data = await processMPCardPayment({
                order_id: currentPref.order_id,
                mp_payment,
                mp_public_key: publicKey,
                ...(device_id ? { device_id } : {}),
              });

              const st = (data.order_status || '').toLowerCase();
              if (st === 'paid') {
                onSuccessRef.current?.(data);
                return;
              }
              if (st === 'payment_failed') {
                onErrorRef.current?.('El pago fue rechazado. Probá con otro medio o datos.');
                throw new Error('payment_failed');
              }
              onSuccessRef.current?.(data);
            } catch (err) {
              const msg = err.message || 'Error al procesar el pago.';
              if (msg !== 'payment_failed') {
                onErrorRef.current?.(msg);
              }
              throw err;
            }
          },
        },
      };

      try {
        const ctrl = await bricksBuilder.create('payment', containerId, settings);
        if (cancelled) {
          ctrl?.unmount?.();
          return;
        }
        controllerRef.current = ctrl;
      } catch (e) {
        console.error('[MP Brick] create:', e);
        onErrorRef.current?.('No se pudo iniciar el checkout de Mercado Pago.');
      }
    })();

    return () => {
      cancelled = true;
      try { controllerRef.current?.unmount?.(); } catch { /* ignore */ }
      controllerRef.current = null;
    };
  }, [publicKey, disabled, amount, prefData, containerId]);

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

  if (prefLoading) {
    return (
      <div className="rounded-md overflow-hidden border border-white/10 bg-[#1a1a1a] p-6 flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[rgb(0,255,255)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white/40 tracking-wide">Preparando medios de pago...</p>
      </div>
    );
  }

  return (
    <div className="rounded-md overflow-hidden border border-white/10 bg-[#1a1a1a] p-2 sm:p-3">
      <div id={containerId} className="min-h-[340px]" />
      <p className="mt-2 text-[10px] text-white/35 text-center tracking-wide">
        Pagás de forma segura con Mercado Pago — tarjeta, débito o dinero en cuenta.
      </p>
    </div>
  );
}
