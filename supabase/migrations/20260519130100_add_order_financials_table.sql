-- Calculadora: datos financieros enriquecidos por pasarela.
--
-- Tabla 1-1 con orders (PK = order_id) que guarda lo que devuelven los
-- webhooks de MP/Nave sobre el desglose económico de cada cobro:
--   - gross_amount:  monto bruto cobrado al cliente
--   - payment_fee:   comisión total de la pasarela
--   - payment_taxes: retenciones/impuestos que aplica la pasarela
--   - net_received:  lo que efectivamente queda en la cuenta del negocio
--   - raw_payload:   JSON crudo del payment para auditoría / re-cálculo
--
-- Se mantiene separada de la tabla orders para no contaminarla con
-- campos específicos por proveedor y permitir múltiples liquidaciones a
-- futuro. RLS habilitada sin policies públicas: lectura y escritura sólo
-- vía service_role desde el server.

CREATE TABLE IF NOT EXISTS public.order_financials (
  order_id     uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  provider     text NOT NULL CHECK (provider IN ('mercadopago', 'nave')),
  gross_amount numeric(12,2),
  payment_fee  numeric(12,2),
  payment_taxes numeric(12,2),
  net_received numeric(12,2),
  raw_payload  jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_financials IS
  'Desglose financiero por orden capturado desde los webhooks de MP/Nave (fees, impuestos retenidos, neto recibido). Consumido por el módulo Calculadora.';

COMMENT ON COLUMN public.order_financials.provider IS 'Proveedor de pago: mercadopago | nave';
COMMENT ON COLUMN public.order_financials.gross_amount IS 'Monto bruto cobrado al cliente (transaction_amount).';
COMMENT ON COLUMN public.order_financials.payment_fee IS 'Comisión total aplicada por la pasarela.';
COMMENT ON COLUMN public.order_financials.payment_taxes IS 'Impuestos/retenciones aplicadas por la pasarela (IVA, IIBB, etc.).';
COMMENT ON COLUMN public.order_financials.net_received IS 'Monto neto efectivamente acreditado al negocio (gross − fee − taxes).';
COMMENT ON COLUMN public.order_financials.raw_payload IS 'Payload crudo del payment (MP /v1/payments o Nave /ranty-payments/payments) para auditoría.';

CREATE INDEX IF NOT EXISTS idx_order_financials_provider
  ON public.order_financials (provider);

ALTER TABLE public.order_financials ENABLE ROW LEVEL SECURITY;

-- Sin policies públicas: la tabla la lee y escribe el server con service_role
-- (que bypasea RLS). El admin la consume vía endpoints autenticados de /api/admin/finance.
