-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Paginación server-side del panel de Sesiones
-- fn_listar_sesiones_recientes(int) pasa a tener un segundo
-- parámetro (p_tenant_id) para poder pedir el detalle de UN solo
-- taller (antes traía TODAS las sesiones de TODOS los talleres y
-- se agrupaba client-side). Como cambia la lista de tipos de
-- parámetros, hay que hacer DROP explícito antes: un
-- CREATE OR REPLACE con una firma distinta no reemplaza la función
-- vieja, crea un overload nuevo y quedan las dos coexistiendo.
-- ════════════════════════════════════════════════════════════

drop function if exists fn_listar_sesiones_recientes(int);

create or replace function fn_listar_sesiones_recientes(p_dias int default 30, p_tenant_id uuid default null)
returns table (
  usuario_id uuid,
  usuario_nombre text,
  usuario_email text,
  tenant_id uuid,
  tenant_nombre text,
  ip text,
  user_agent text,
  created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if app_rol() <> 'master' then
    raise exception 'Solo el master puede ver las sesiones';
  end if;

  return query
  select
    u.id, u.nombre, u.email,
    t.id, t.nombre_empresa,
    s.ip::text, s.user_agent, s.created_at
  from auth.sessions s
  join public.usuarios u on u.id = s.user_id
  left join public.tenants t on t.id = u.tenant_id
  where s.created_at > now() - (p_dias || ' days')::interval
    and (p_tenant_id is null or u.tenant_id = p_tenant_id)
  order by t.nombre_empresa nulls last, s.created_at desc;
end;
$$;

revoke execute on function fn_listar_sesiones_recientes(int, uuid) from public, anon;
grant execute on function fn_listar_sesiones_recientes(int, uuid) to authenticated;

-- Resumen paginado por taller — reemplaza el agrupamiento client-side
-- que hacía SessionsPage.tsx. Cada fila ya viene agregada; el detalle
-- de sesiones de un taller puntual se pide aparte (RPC de arriba) recién
-- al expandir esa fila.
create or replace function fn_listar_tenants_con_sesiones(
  p_dias int default 30,
  p_page int default 1,
  p_page_size int default 20
)
returns table (
  tenant_id uuid,
  tenant_nombre text,
  usuarios_distintos bigint,
  total_sesiones bigint,
  ips_distintas bigint,
  total_tenants bigint
)
language plpgsql security definer set search_path = public as $$
begin
  if app_rol() <> 'master' then
    raise exception 'Solo el master puede ver las sesiones';
  end if;

  return query
  select
    t.id,
    t.nombre_empresa,
    count(distinct u.id),
    count(*),
    count(distinct s.ip),
    count(*) over() as total_tenants
  from auth.sessions s
  join public.usuarios u on u.id = s.user_id
  join public.tenants t on t.id = u.tenant_id
  where s.created_at > now() - (p_dias || ' days')::interval
  group by t.id, t.nombre_empresa
  order by count(distinct s.ip) desc
  offset (p_page - 1) * p_page_size
  limit p_page_size;
end;
$$;

revoke execute on function fn_listar_tenants_con_sesiones(int, int, int) from public, anon;
grant execute on function fn_listar_tenants_con_sesiones(int, int, int) to authenticated;
