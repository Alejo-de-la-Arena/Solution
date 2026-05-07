import { useEffect, useRef, useId, useState } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { createMPPreference, processMPCardPayment, setCheckoutPaymentProvider } from '../../services/checkout';

/**
 * MercadoPago checkout:
 *   – Card Payment Brick para tarjetas de crédito/débito (embebido)
 *   – Botón de redirección a Checkout Pro para dinero en cuenta / otros medios
 *
 * La orden NO se crea al montar el componente. Se crea solo cuando el usuario
 * inicia un pago real: al submit del Brick (tarjeta) o al click del botón wallet.
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

  const [walletLoading, setWalletLoading] = useState(false);

  const getCheckoutPayloadRef = useRef(getCheckoutPayload);
  getCheckoutPayloadRef.current = getCheckoutPayload;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onBrickReadyRef = useRef(onBrickReady);
  onBrickReadyRef.current = onBrickReady;

  // ── Renderizar Card Payment Brick (solo tarjetas, sin preferenceId) ─────
  useEffect(() => {
    if (!publicKey || disabled || !(Number(amount) > 0)) return undefined;

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
          // NO preferenceId → el Brick muestra solo tarjetas (crédito + débito)
          // Wallet/dinero en cuenta se maneja con el botón de redirección abajo
        },
        customization: {
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
          },
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

          onSubmit: async (formData, additionalData) => {
            const basePayload = typeof getCheckoutPayloadRef.current === 'function'
              ? getCheckoutPayloadRef.current()
              : null;
            if (!basePayload?.customer_name || !basePayload?.customer_email) {
              onErrorRef.current?.('Completá nombre y email antes de pagar.');
              throw new Error('missing_checkout_payload');
            }

            try {
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
                device_id = typeof window !== 'undefined' && window.MP_DEVICE_SESSION_ID
                  ? String(window.MP_DEVICE_SESSION_ID)
                  : undefined;
              } catch { device_id = undefined; }

              setCheckoutPaymentProvider('mercadopago');

              const data = await processMPCardPayment({
                ...basePayload,
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
              if (msg !== 'payment_failed' && msg !== 'missing_checkout_payload') {
                onErrorRef.current?.(msg);
              }
              throw err;
            }
          },
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
        onErrorRef.current?.('No se pudo iniciar el checkout de Mercado Pago.');
      }
    })();

    return () => {
      cancelled = true;
      try { controllerRef.current?.unmount?.(); } catch { /* ignore */ }
      controllerRef.current = null;
    };
  }, [publicKey, disabled, amount, containerId]);

  // ── Handler para wallet redirect: crea orden + preferencia on-demand ────
  const handleWalletRedirect = async () => {
    if (walletLoading) return;
    const base = typeof getCheckoutPayloadRef.current === 'function'
      ? getCheckoutPayloadRef.current()
      : null;
    if (!base?.customer_name || !base?.customer_email) {
      onError?.('Completá nombre y email antes de pagar.');
      return;
    }

    setWalletLoading(true);
    try {
      setCheckoutPaymentProvider('mercadopago');
      const data = await createMPPreference({
        ...base,
        callback_url: `${window.location.origin}/checkout`,
      });
      if (!data?.init_point) {
        onError?.('No se pudo preparar el pago con Mercado Pago. Intentá de nuevo.');
        setWalletLoading(false);
        return;
      }

      // Guardar con key dedicada que NADA más toca
      try {
        const items = (base.items || []).map((i) => ({
          id: i.product_id || i.id,
          quantity: i.quantity,
        }));
        const totalValue = items.reduce((sum, it) => {
          const orig = (base.items || []).find((x) => (x.product_id || x.id) === it.id);
          return sum + (orig?.unit_price || 0) * it.quantity;
        }, 0) + (base.shipping_cost || 0);
        const snap = JSON.stringify({ items, totalValue });
        localStorage.setItem('purchase_snapshot', snap);
        localStorage.setItem('mp_purchase_backup', snap);
        sessionStorage.setItem('mp_purchase_backup', snap);
      } catch { /* ignore */ }

      window.location.assign(data.init_point);
    } catch (err) {
      onError?.(err.message || 'No se pudo preparar el pago con Mercado Pago.');
      setWalletLoading(false);
    }
  };

  // ── Renders condicionales ───────────────────────────────────────────
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
    <div className="space-y-4">
      {/* Card Payment Brick — tarjeta crédito/débito */}
      <div className="rounded-md overflow-hidden border border-white/10 bg-[#1a1a1a] p-2 sm:p-3">
        <div id={containerId} className="min-h-[340px]" />
      </div>

      {/* Separador */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-white/30 tracking-widest uppercase">o</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Botón Checkout Pro — dinero en cuenta, Rapipago, etc. */}
      <button
        type="button"
        onClick={handleWalletRedirect}
        disabled={walletLoading}
        className="w-full flex items-center justify-center gap-3 bg-[#009ee3] hover:bg-[#007eb5] text-white py-3.5 px-6 rounded-md text-sm font-semibold tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {walletLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Redirigiendo...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Pagar con dinero en cuenta u otros medios
          </>
        )}
      </button>

      <p className="text-[10px] text-white/35 text-center tracking-wide">
        Pagás de forma segura con Mercado Pago — tarjeta, débito o dinero en cuenta.
      </p>
    </div>
  );
}
