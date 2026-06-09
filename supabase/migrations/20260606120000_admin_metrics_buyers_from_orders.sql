-- Ajuste del dashboard admin: las métricas de "usuarios" ahora cuentan
-- COMPRADORES ÚNICOS reales (distinct customer_email en órdenes efectivas),
-- porque la mayoría compra como guest sin crear cuenta en profiles.
-- Ventas efectivas = órdenes con status IN ('paid','shipped').
create or replace function public.admin_billing_metrics()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select
      (now() at time zone 'America/Argentina/Buenos_Aires')::date            as today,
      date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires')::date as month_start,
      (date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires') - interval '1 month')::date as last_month_start
  ),
  eff as (
    select
      o.total,
      lower(nullif(trim(o.customer_email), '')) as email,
      (o.created_at at time zone 'America/Argentina/Buenos_Aires')::date as local_date
    from orders o
    where o.status in ('paid', 'shipped')
  ),
  rev as (
    select
      coalesce(sum(total), 0)                                                                              as revenue_total,
      count(*)                                                                                             as orders_total,
      coalesce(sum(total) filter (where local_date = b.today), 0)                                          as revenue_today,
      count(*) filter (where local_date = b.today)                                                         as orders_today,
      coalesce(sum(total) filter (where local_date >= b.month_start), 0)                                   as revenue_this_month,
      count(*) filter (where local_date >= b.month_start)                                                  as orders_this_month,
      coalesce(sum(total) filter (where local_date >= b.last_month_start and local_date < b.month_start), 0) as revenue_last_month,
      count(*) filter (where local_date >= b.last_month_start and local_date < b.month_start)              as orders_last_month
    from eff, bounds b
    group by b.today, b.month_start, b.last_month_start
  ),
  rev0 as (
    select
      coalesce((select revenue_total from rev), 0)        as revenue_total,
      coalesce((select orders_total from rev), 0)         as orders_total,
      coalesce((select revenue_today from rev), 0)        as revenue_today,
      coalesce((select orders_today from rev), 0)         as orders_today,
      coalesce((select revenue_this_month from rev), 0)   as revenue_this_month,
      coalesce((select orders_this_month from rev), 0)    as orders_this_month,
      coalesce((select revenue_last_month from rev), 0)   as revenue_last_month,
      coalesce((select orders_last_month from rev), 0)    as orders_last_month
  ),
  usr as (
    -- compradores únicos reales, por email, sobre órdenes efectivas
    select
      count(distinct email)                                                                              as users_total,
      count(distinct email) filter (where local_date = b.today)                                          as users_today,
      count(distinct email) filter (where local_date >= b.month_start)                                   as users_this_month,
      count(distinct email) filter (where local_date >= b.last_month_start and local_date < b.month_start) as users_last_month
    from eff, bounds b
    where email is not null
    group by b.today, b.month_start, b.last_month_start
  ),
  daily as (
    select local_date, sum(total) as revenue, count(*) as orders
    from eff, bounds b
    where local_date >= (b.today - interval '29 days')
    group by local_date
    order by local_date
  ),
  daily_json as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'date', to_char(local_date, 'YYYY-MM-DD'),
          'revenue', revenue,
          'orders', orders
        ) order by local_date
      ),
      '[]'::jsonb
    ) as arr
    from daily
  )
  select jsonb_build_object(
    'revenue_total',        (select revenue_total from rev0),
    'revenue_today',        (select revenue_today from rev0),
    'revenue_this_month',   (select revenue_this_month from rev0),
    'revenue_last_month',   (select revenue_last_month from rev0),
    'orders_total',         (select orders_total from rev0),
    'orders_today',         (select orders_today from rev0),
    'orders_this_month',    (select orders_this_month from rev0),
    'orders_last_month',    (select orders_last_month from rev0),
    'avg_ticket_total',     case when (select orders_total from rev0) > 0
                                 then round((select revenue_total from rev0)::numeric / (select orders_total from rev0), 2)
                                 else 0 end,
    'avg_ticket_this_month', case when (select orders_this_month from rev0) > 0
                                 then round((select revenue_this_month from rev0)::numeric / (select orders_this_month from rev0), 2)
                                 else 0 end,
    'users_total',          coalesce((select users_total from usr), 0),
    'users_today',          coalesce((select users_today from usr), 0),
    'users_this_month',     coalesce((select users_this_month from usr), 0),
    'users_last_month',     coalesce((select users_last_month from usr), 0),
    'daily_revenue',        (select arr from daily_json)
  );
$$;
