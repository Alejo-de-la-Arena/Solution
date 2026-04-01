import { useEffect, useMemo, useRef } from 'react';

function env(name, fallback = '') {
  return (import.meta.env[name] || fallback || '').toString().trim();
}

/**
 * Checkout embebido Nave vía @ranty/ranty-sdk (<payfac-sdk />).
 */
export default function NaveEmbed({ paymentRequestId, onMessage }) {
  const elRef = useRef(null);
  const publicKey = useMemo(() => env('VITE_NAVE_PUBLIC_KEY'), []);
  // Default sandbox: alinea con api-sandbox.ranty.io (mismo clúster que create-payment con NAVE_ENV=testing). "staging" en el SDK usa e3-api y no encuentra el payment_request_id.
  const naveEnv = useMemo(() => env('VITE_NAVE_ENV', 'sandbox'), []);

  useEffect(() => {
    import('@ranty/ranty-sdk');
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    if (publicKey) {
      el.setAttribute('publicKey', publicKey);
      el.publicKey = publicKey;
    }
    if (paymentRequestId) {
      el.setAttribute('paymentRequestId', paymentRequestId);
      el.paymentRequestId = paymentRequestId;
    }
    if (naveEnv) {
      el.setAttribute('env', naveEnv);
      el.env = naveEnv;
    }
  }, [publicKey, paymentRequestId, naveEnv]);

  useEffect(() => {
    if (!onMessage) return undefined;
    const handler = (event) => {
      if (!event?.data) return;
      onMessage(event.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  if (!publicKey || !paymentRequestId) {
    return (
      <div className="border border-red-500/40 bg-red-500/10 rounded-md p-4 text-sm text-red-200">
        {!publicKey ? 'Falta VITE_NAVE_PUBLIC_KEY en Solution/client/.env' : null}
        {!publicKey && !paymentRequestId ? ' · ' : null}
        {!paymentRequestId ? 'Falta paymentRequestId para inicializar Nave' : null}
      </div>
    );
  }

  return <payfac-sdk ref={elRef} style={{ display: 'block', width: '100%' }} />;
}
