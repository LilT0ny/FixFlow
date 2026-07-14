-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Bitácora de auditoría
-- Generaliza el patrón ya usado en historial_estado_orden/fn_log_estado
-- (20260707020100_v2_logic.sql:41-54) a las tablas de negocio.
-- ════════════════════════════════════════════════════════════

-- 1. Tabla
create table bitacora_auditoria (
  id            bigint generated always as identity primary key,
  tenant_id     uuid not null references tenants(id),
  tabla         text not null,
  registro_id   uuid,
  accion        text not null check (accion in ('insert', 'update', 'delete')),
  actor         uuid references usuarios(id),
  datos_antes   jsonb,
  datos_despues jsonb,
  created_at    timestamptz not null default now()
);
create index idx_auditoria_tenant_fecha on bitacora_auditoria (tenant_id, created_at desc);

-- 2. Trigger genérico (security definer, mismo patrón que fn_log_estado).
--    Usa to_jsonb(...) en vez de acceso directo a campos del record porque
--    `ajustes` no tiene columna `id` (su PK es tenant_id) — con jsonb el
--    fallback a tenant_id no rompe cuando la clave 'id' no existe.
--    El guard de tenant nulo (fila del master en `usuarios`) vive DENTRO
--    de la función — un trigger combinado insert/update/delete no puede
--    llevar un WHEN que referencie NEW, porque en un delete no existe.
create or replace function fn_log_auditoria() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_row    jsonb := to_jsonb(coalesce(new, old));
  v_tenant uuid  := coalesce((v_row->>'tenant_id')::uuid, app_tenant_id());
begin
  if v_tenant is null then
    return coalesce(new, old);
  end if;

  insert into bitacora_auditoria (tenant_id, tabla, registro_id, accion, actor, datos_antes, datos_despues)
  values (
    v_tenant,
    TG_TABLE_NAME,
    coalesce((v_row->>'id')::uuid, (v_row->>'tenant_id')::uuid),
    lower(TG_OP),
    auth.uid(),
    case when TG_OP in ('update', 'delete') then to_jsonb(old) else null end,
    case when TG_OP in ('insert', 'update') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

-- 3. Triggers sobre las tablas de negocio relevantes (mismo estilo de loop
--    que el de RLS en 20260707020200_v2_security.sql:66-85). `usuarios` va
--    en el mismo loop: la fila del master (tenant_id null) queda excluida
--    por el guard de la función, no por un WHEN en el trigger. Quedan
--    afuera a propósito: fotos_evidencia (ruido operativo),
--    historial_estado_orden (ya es en sí mismo un log), contadores,
--    nota_venta_item y permisos_modulo (bajo valor para v1).
do $$
declare t text;
begin
  foreach t in array array['clientes', 'dispositivos', 'ordenes_servicio', 'orden_trabajo',
                           'transacciones', 'notas_venta', 'ajustes', 'usuarios']
  loop
    execute format(
      'create trigger trg_auditoria_%1$s after insert or update or delete on %1$s for each row execute function fn_log_auditoria();',
      t);
  end loop;
end $$;

-- 4. RLS: solo owner (de su propio tenant) y master pueden LEER. Nadie
--    puede editar/borrar bitácora (inmutable por diseño — sin policies de
--    update/delete, RLS deniega por defecto).
alter table bitacora_auditoria enable row level security;

create policy auditoria_select on bitacora_auditoria for select
  using (app_rol() = 'master' or (app_rol() = 'owner' and tenant_id = app_tenant_id()));

create policy auditoria_insert on bitacora_auditoria for insert
  with check (tenant_id = app_tenant_id());

-- 5. Hardening (mismo criterio que 20260707020300_v2_hardening.sql:14):
--    las funciones de trigger no son API, nadie las llama por PostgREST.
revoke execute on function fn_log_auditoria() from public, anon, authenticated;
