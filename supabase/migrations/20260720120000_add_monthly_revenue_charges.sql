-- Calculadora: cargo mensual conmutable sobre la facturación.
--
-- Algunos meses al negocio le retienen un % de TODO lo facturado (por defecto
-- 7%). Es un switch on/off por mes con porcentaje editable. Cuando está ON, el
-- cierre descuenta `percentage`% de los ingresos brutos (orders.total) de ese
-- mes; los meses OFF no descuentan nada.
--
-- Semántica:
--   - NO existe fila para el mes      → OFF (no se cobra). Default en la UI: 7%.
--   - fila con enabled = true         → se cobra percentage% de lo facturado.
--   - fila con enabled = false        → OFF, pero recuerda el percentage elegido.
-- Por eso guardamos enabled aparte del percentage: apagar no debe perder el %.
--
-- `month` se normaliza al día 1 del mes (hora Argentina); único por mes.

CREATE TABLE IF NOT EXISTS public.monthly_revenue_charges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month       date NOT NULL UNIQUE,
  enabled     boolean NOT NULL DEFAULT true,
  percentage  numeric(5,2) NOT NULL DEFAULT 7.00 CHECK (percentage >= 0 AND percentage <= 100),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid,
  -- Defensa extra: que month sea siempre el día 1 del mes.
  CONSTRAINT monthly_revenue_charges_month_is_first_day CHECK (date_trunc('month', month) = month)
);

COMMENT ON TABLE public.monthly_revenue_charges IS
  'Cargo mensual conmutable: % sobre lo facturado (ingresos brutos) que aplica sólo en los meses ON. Consumido por la Calculadora.';
COMMENT ON COLUMN public.monthly_revenue_charges.month IS 'Mes al que aplica, normalizado al día 1 (hora Argentina).';
COMMENT ON COLUMN public.monthly_revenue_charges.enabled IS 'Switch on/off del cargo para ese mes. Ausencia de fila = off.';
COMMENT ON COLUMN public.monthly_revenue_charges.percentage IS 'Porcentaje sobre ingresos brutos del mes (default 7). Se recuerda aunque enabled sea false.';

CREATE INDEX IF NOT EXISTS idx_monthly_revenue_charges_month
  ON public.monthly_revenue_charges (month);

ALTER TABLE public.monthly_revenue_charges ENABLE ROW LEVEL SECURITY;

-- Sin policies públicas: consumido sólo vía /api/admin/finance/* con service_role.
