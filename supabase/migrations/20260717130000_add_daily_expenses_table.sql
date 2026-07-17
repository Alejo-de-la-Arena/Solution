-- Calculadora: gasto dinámico POR DÍA (pauta publicitaria).
--
-- Distinto de fixed_expenses.frequency='daily', que aplica el MISMO monto todos
-- los días de un rango. Acá cada fecha tiene su valor real (hoy $15.000, ayer
-- $8.000), cargado a mano en el cierre de cada día.
--
-- Semántica de "cargado vs no cargado":
--   - NO existe fila para (fecha, categoría)  → NO cargado. El reporte lo asume
--     $0 pero AVISA que falta (día sin pauta cargada).
--   - existe fila con amount = 0              → cargado como $0. Confirmación
--     explícita de que ese día no hubo pauta; el aviso se silencia.
-- Por eso amount permite 0 y la ausencia de fila es significativa: nunca se
-- inserta una fila 0 "de relleno".
--
-- category deja la puerta abierta a otros gastos diarios variables a futuro
-- (ej. 'pauta_google'), pero hoy la UI carga sólo 'pauta'.

CREATE TABLE IF NOT EXISTS public.daily_expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date  date NOT NULL,
  category      text NOT NULL DEFAULT 'pauta',
  amount        numeric(12,2) NOT NULL CHECK (amount >= 0),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid,
  -- Un único valor por (día, categoría): el PUT del cierre hace upsert sobre esto.
  CONSTRAINT daily_expenses_date_category_uniq UNIQUE (expense_date, category)
);

COMMENT ON TABLE public.daily_expenses IS
  'Gasto variable por día (pauta publicitaria) cargado manualmente en el cierre diario de la calculadora. La ausencia de fila = no cargado (se avisa); amount=0 = confirmado sin gasto.';
COMMENT ON COLUMN public.daily_expenses.expense_date IS 'Día al que corresponde el gasto (hora Argentina).';
COMMENT ON COLUMN public.daily_expenses.category IS 'Categoría del gasto diario. Default pauta; extensible a otros gastos variables por día.';
COMMENT ON COLUMN public.daily_expenses.amount IS 'Monto real gastado ese día en esa categoría (ARS). 0 = confirmado sin gasto.';

CREATE INDEX IF NOT EXISTS idx_daily_expenses_date
  ON public.daily_expenses (expense_date);

ALTER TABLE public.daily_expenses ENABLE ROW LEVEL SECURITY;

-- Sin policies públicas: consumido sólo vía /api/admin/finance/* con service_role.
