import { useEffect, useRef, useId, useState } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { createMPPreference, processMPCardPayment, setCheckoutPaymentProvider } from '../../services/checkout';

/**
 * MercadoPago checkout:
 *   – Card Payment Brick para tarjetas de crédito/débito (embebido)
 *   – Botón de redirección a Checkout Pro para dinero en cuenta / otros medios
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

  // Preference state (para orden DB + init_point de wallet)
  const [prefData, setPrefData] = useState(null);   // { order_id, preference_id, init_point }
  const [prefLoading, setPrefLoading] = useState(false);
  const [walletRedirecting, setWalletRedirecting] = useState(false);

  // Stable refs
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

  // ── 1) Crear preferencia (orden DB + preference MP) ──────────────────
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
        if (!cancelled) {
          if (!data?.order_id) {
            onErrorRef.current?.('No se pudo crear la orden de pago.');
            return;
          }
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

  // ── 2) Renderizar Card Payment Brick (solo tarjetas, sin preferenceId) ─
  useEffect(() => {
    if (!publicKey || disabled || !prefData?.order_id) return undefined;

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
            const currentPref = prefDataRef.current;
            if (!currentPref?.order_id) {
              onErrorRef.current?.('Error interno: orden no encontrada.');
              throw new Error('missing_order_id');
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
  }, [publicKey, disabled, amount, prefData, containerId]);

  // ── 3) Handler para wallet redirect ─────────────────────────────────
  const handleWalletRedirect = () => {
    if (!prefData?.init_point) {
      onError?.('No se pudo preparar el pago con Mercado Pago. Intentá de nuevo.');
      return;
    }
    setWalletRedirecting(true);
    window.location.assign(prefData.init_point);
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

  if (prefLoading) {
    return (
      <div className="rounded-md overflow-hidden border border-white/10 bg-[#1a1a1a] p-6 flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[rgb(0,255,255)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white/40 tracking-wide">Preparando medios de pago...</p>
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
      {prefData?.init_point && (
        <button
          type="button"
          onClick={handleWalletRedirect}
          disabled={walletRedirecting}
          className="w-full flex items-center justify-center gap-3 bg-[#009ee3] hover:bg-[#007eb5] text-white py-3.5 px-6 rounded-md text-sm font-semibold tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {walletRedirecting ? (
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
      )}

      <p className="text-[10px] text-white/35 text-center tracking-wide">
        Pagás de forma segura con Mercado Pago — tarjeta, débito o dinero en cuenta.
      </p>
    </div>
  );
}