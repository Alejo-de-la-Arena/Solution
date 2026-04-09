import { useEffect, useRef, useId, useCallback } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { createMPOrder, createMPPreference, setCheckoutPaymentProvider } from '../../services/checkout';

/**
 * Payment Brick: tarjetas + dinero en cuenta Mercado Pago (requiere preferencia en backend).
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
  const orderIdRef = useRef(null);
  const publicKey = (import.meta.env.VITE_MP_PUBLIC_KEY || '').trim();

  const submitCardPayment = useCallback(
    async (fd, additionalData) => {
      const base = typeof getCheckoutPayload === 'function' ? getCheckoutPayload() : null;
      if (!base?.customer_email) {
        onError?.('Faltan datos del checkout.');
        throw new Error('Missing checkout');
      }
      const oid = orderIdRef.current;
      if (!oid) {
        onError?.('Sesión de pago no lista. Recargá la página.');
        throw new Error('no order id');
      }

      setCheckoutPaymentProvider('mercadopago');

      const mp_payment = {
        token: fd.token,
        payment_method_id: fd.payment_method_id,
        payment_type_id: additionalData?.paymentTypeId || fd.payment_type_id,
        installments: fd.installments ?? 1,
        payer: fd.payer,
        transaction_amount: fd.transaction_amount,
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

      const data = await createMPOrder({
        order_id: oid,
        customer_email: base.customer_email,
        mp_payment,
        ...(device_id ? { device_id } : {}),
      });
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

      const base = typeof getCheckoutPayload === 'function' ? getCheckoutPayload() : null;
      if (!base?.customer_email) {
        onError?.('Completá email y datos de envío.');
        return;
      }

      let preferenceId;
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const pref = await createMPPreference({
          ...base,
          return_url_base: origin,
        });
        preferenceId = pref.preference_id;
        orderIdRef.current = pref.order_id;
        setCheckoutPaymentProvider('mercadopago');
      } catch (e) {
        console.error('[MP Brick] create-preference:', e);
        onError?.(e.message || 'No se pudo iniciar el pago.');
        return;
      }
      if (cancelled || !preferenceId) return;

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
          preferenceId,
          payer: {
            email: base.customer_email,
          },
        },
        customization: {
          visual: {
            style: {
              theme: 'dark',
            },
          },
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            prepaidCard: 'all',
            mercadoPago: 'all',
          },
        },
        callbacks: {
          onReady: () => onBrickReady?.(),
          onError: (error) => {
            console.error('[MP Brick] onError:', error);
            onError?.(error?.message || 'Error en el formulario de pago');
          },
          onSubmit: (paymentData, additionalData) =>
            new Promise((resolve, reject) => {
              const selected = paymentData?.selectedPaymentMethod || paymentData?.paymentMethod;
              const fd = paymentData?.formData;

              if (selected === 'wallet_purchase') {
                resolve();
                return;
              }

              if (selected === 'credit_card' || selected === 'debit_card' || selected === 'prepaid_card') {
                if (!fd) {
                  onError?.('Datos de tarjeta incompletos.');
                  reject(new Error('no formData'));
                  return;
                }
                submitCardPayment(fd, additionalData || {})
                  .then(() => resolve())
                  .catch(() => reject());
                return;
              }

              onError?.('Elegí tarjeta o Dinero en cuenta Mercado Pago.');
              reject(new Error('unsupported_payment'));
            }),
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
        console.error('[MP Brick] create payment:', e);
        onError?.('No se pudo mostrar el checkout de Mercado Pago.');
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
      orderIdRef.current = null;
    };
  }, [publicKey, disabled, amount, containerId, getCheckoutPayload, onError, onBrickReady, submitCardPayment]);

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
      <div id={containerId} className="min-h-[320px]" />
      <p className="mt-2 text-[10px] text-white/35 text-center tracking-wide">
        Podés pagar con tarjeta o con dinero en tu cuenta Mercado Pago. Los datos sensibles los procesa Mercado Pago.
      </p>
    </div>
  );
}
