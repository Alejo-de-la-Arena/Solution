-- Notificación al dueño cuando entra una venta.
--
-- 1) Columna de idempotencia: timestamp seteado luego de enviar exitosamente
--    el email al admin (independiente del flag del cliente).
-- 2) Realtime: incluir `orders` en la publication para que el dashboard
--    admin reciba eventos UPDATE en tiempo real.
-- 3) RLS: policy de SELECT para admins (Supabase Realtime respeta RLS — sin
--    esta policy el cliente logueado como admin no recibe el payload).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_notification_sent_at timestamptz;

COMMENT ON COLUMN public.orders.admin_notification_sent_at IS
  'Timestamp del envío exitoso del email de "nueva venta" al dueño (ADMIN_NOTIFICATION_EMAIL).';

-- Publication: agregar orders si no estaba (no-op si ya estaba).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- RLS: la tabla la escribe el server con service_role (bypass de RLS).
-- Agregamos una policy SELECT para que los admins logueados puedan leer
-- via anon key + JWT (necesario para que Realtime entregue eventos).
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'admins_select_orders'
  ) THEN
    CREATE POLICY "admins_select_orders"
      ON public.orders
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
      );
  END IF;
END $$;
