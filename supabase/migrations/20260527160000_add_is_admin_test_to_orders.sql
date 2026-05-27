-- Flag para órdenes creadas como prueba por un admin logueado.
-- El override (unit_price=150, shipping=0) se aplica server-side validando el
-- bearer token contra Supabase. Se persiste para que el webhook de cobro pueda
-- skippear la notificación "nueva venta" al admin (evita spam de pruebas).
alter table public.orders
  add column if not exists is_admin_test boolean not null default false;
