import { useLayoutEffect, useMemo, useRef } from 'react';

function env(name, fallback = '') {
  return (import.meta.env[name] || fallback || '').toString().trim();
}

/** Sin título/subtítulo duplicados respecto al modal; redirect automático al terminar (SDK). */
const NAVE_EMBED_SETTINGS = {
  customerProperties: {
    show_title: false,
    show_subtitle: false,
    show_order_detail: true,
    enable_auto_redirect: true,
    hide_footer: false,
  },
};

/**
 * Checkout embebido Nave vía @ranty/ranty-sdk (<payfac-sdk />).
 * El elemento se crea de forma imperativa para que `settings` exista antes del firstUpdated de Lit.
 */
export default function NaveEmbed({ paymentRequestId }) {
  const hostRef = useRef(null);
  const publicKey = useMemo(() => env('VITE_NAVE_PUBLIC_KEY'), []);
  // Default sandbox: alinea con api-sandbox.ranty.io (mismo clúster que create-payment con NAVE_ENV=testing). "staging" en el SDK usa e3-api y no encuentra el payment_request_id.
  const naveEnv = useMemo(() => env('VITE_NAVE_ENV', 'sandbox'), []);

  useLayoutEffect(() => {
    if (!publicKey || !paymentRequestId) return undefined;

    const host = hostRef.current;
    if (!host) return undefined;

    let cancelled = false;

    (async () => {
      await import('@ranty/ranty-sdk');
      if (cancelled || !hostRef.current) return;

      host.innerHTML = '';
      const el = document.createElement('payfac-sdk');
      el.publicKey = publicKey;
      el.paymentRequestId = paymentRequestId;
      el.env = naveEnv;
      el.settings = NAVE_EMBED_SETTINGS;
      el.style.display = 'block';
      el.style.width = '100%';
      el.style.minHeight = 'min(58dvh, 480px)';
      host.appendChild(el);
    })();

    return () => {
      cancelled = true;
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [publicKey, paymentRequestId, naveEnv]);

  if (!publicKey || !paymentRequestId) {
    return (
      <div className="m-4 rounded-lg border border-red-500/35 bg-red-500/[0.08] p-4 text-sm text-red-100">
        {!publicKey ? 'Falta VITE_NAVE_PUBLIC_KEY en Solution/client/.env' : null}
        {!publicKey && !paymentRequestId ? ' · ' : null}
        {!paymentRequestId ? 'Falta paymentRequestId para inicializar Nave' : null}
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="w-full flex-1 min-h-[min(58dvh,260px)] sm:min-h-[min(68dvh,560px)]"
    />
  );
}
