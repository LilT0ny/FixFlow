-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Grupo empresarial (cadenas de sucursales)
-- Vínculo opcional entre tenants + RPC de agregados para el
-- dashboard consolidado del Plan Empresarial. Solo Master Admin
-- administra grupos y asigna sucursales — el owner nunca ve
-- filas crudas de otro tenant, solo números calculados server-side.
-- ════════════════════════════════════════════════════════════

-- 1. Grupos (la "cadena" comercial)
create table grupos_empresariales (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  created_at timestamptz not null default now()
);
alter table grupos_empresariales enable row level security;
create policy grupos_all on grupos_empresariales for all
  using (app_rol() = 'master') with check (app_rol() = 'master');

-- 2. Vínculo opcional tenant → grupo
alter table tenants add column grupo_id uuid references grupos_empresariales(id);

-- 3. Guardrail: la policy tenants_update ya deja que un owner actualice su
--    propia fila de tenants; sin esto podría auto-asignarse el grupo de
--    una cadena ajena y ver sus agregados. Solo master puede tocar grupo_id.
create or replace function fn_protect_grupo_id() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.grupo_id is distinct from old.grupo_id and app_rol() <> 'master' then
    raise exception 'Solo el master puede asignar el grupo empresarial de un tenant';
  end if;
  return new;
end;
$$;
create trigger trg_protect_grupo_id before update on tenants
  for each row execute function fn_protect_grupo_id();

-- 4. RPC de agregados — SOLO números por sucursal, nunca filas crudas de
--    clientes/órdenes de otro tenant. Devuelve [] si quien llama no es
--    owner o su tenant no pertenece a ningún grupo.
create or replace function fn_dashboard_grupo() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_grupo uuid;
  v_result jsonb;
begin
  if app_rol() <> 'owner' then
    return '[]'::jsonb;
  end if;

  select grupo_id into v_grupo from tenants where id = app_tenant_id();
  if v_grupo is null then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(fila), '[]'::jsonb) into v_result
  from (
    select
      t.id as tenant_id,
      t.nombre_empresa as sucursal,
      (select count(*) from ordenes_servicio o
        where o.tenant_id = t.id and o.deleted_at is null
          and o.estado not in ('entregado', 'no_reparado')) as ordenes_activas,
      (select coalesce(sum(tr.monto), 0) from transacciones tr
        where tr.tenant_id = t.id and tr.tipo = 'ingreso'
          and tr.fecha >= date_trunc('month', now())) as ingresos_mes,
      (select coalesce(sum(tr.monto), 0) from transacciones tr
        where tr.tenant_id = t.id and tr.tipo = 'egreso'
          and tr.fecha >= date_trunc('month', now())) as egresos_mes
    from tenants t
    where t.grupo_id = v_grupo
    order by t.nombre_empresa
  ) fila;

  return v_result;
end;
$$;

revoke execute on function fn_dashboard_grupo() from public, anon;
grant execute on function fn_dashboard_grupo() to authenticated;
