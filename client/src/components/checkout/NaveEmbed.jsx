import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

function env(name, fallback = '') {
  return (import.meta.env[name] || fallback || '').toString().trim();
}

const NAVE_EMBED_SETTINGS = {
  show_title: false,
  show_subtitle: false,
  show_order_detail: true,
  enable_auto_redirect: true,
};

export default function NaveEmbed({ paymentRequestId }) {
  const hostRef = useRef(null);
  const publicKey = useMemo(() => env('VITE_NAVE_PUBLIC_KEY'), []);
  const naveEnv = useMemo(() => env('VITE_NAVE_ENV', 'sandbox'), []);

  // DEBUG: log config on mount so we can verify what the SDK receives
  useEffect(() => {
    console.log('[NaveEmbed] config:', {
      publicKey,
      naveEnv,
      paymentRequestId,
      origin: window.location.origin,
      hostname: window.location.hostname,
    });
  }, [publicKey, naveEnv, paymentRequestId]);

  // DEBUG: capture all SDK postMessage events
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type) {
        console.log('[NaveEmbed] postMessage:', e.data);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

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
      className="w-full"
    />
  );
}
