-- Calculadora: gastos fijos / pauta publicitaria cargados manualmente por admin.
--
-- Modelo con vigencia por fila: al editar un gasto se cierra la fila previa
-- con effective_until y se crea una nueva. Así el reporte de un mes pasado
-- siempre usa el valor vigente durante ese mes, sin alterarse por cambios
-- posteriores. Pauta publicitaria entra como una category más (no tabla aparte).
--
-- frequency normaliza la unidad temporal del amount:
--   monthly  → amount por mes
--   weekly   → amount por semana
--   daily    → amount por día
--   annual   → amount por año
--   one-time → gasto único el día de effective_from

CREATE TABLE IF NOT EXISTS public.fixed_expenses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  category        text,
  amount          numeric(12,2) NOT NULL,
  frequency       text NOT NULL CHECK (frequency IN ('monthly','weekly','daily','annual','one-time')),
  effective_from  date NOT NULL,
  effective_until date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid
);

COMMENT ON TABLE public.fixed_expenses IS
  'Gastos fijos y pauta publicitaria cargados manualmente desde admin/calculadora. Modelo con vigencia por fila.';

COMMENT ON COLUMN public.fixed_expenses.category IS
  'Categoría libre: pauta, agencia, contador, infra, logistica, otro. No es enum para no atar al cliente.';
COMMENT ON COLUMN public.fixed_expenses.effective_until IS
  'NULL = gasto vigente. Al editar, se setea esta fecha en la fila previa y se inserta una nueva.';
COMMENT ON COLUMN public.fixed_expenses.created_by IS
  'auth.users.id del admin que cargó el gasto (informativo).';

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_effective
  ON public.fixed_expenses (effective_from, effective_until);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category
  ON public.fixed_expenses (category);

ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Sin policies públicas: consumido sólo vía /api/admin/finance/* con service_role.
