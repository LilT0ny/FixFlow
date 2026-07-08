-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Migración 6: bloquear signup público en la BD
-- En este SaaS nadie se auto-registra: los usuarios los crea el
-- master (owners) o el owner (members) vía la Edge Function
-- create-user, que setea rol/tenant_id en app_metadata.
-- Un signup público llega SIN esos campos → se rechaza acá,
-- sin depender del toggle del dashboard.
-- ════════════════════════════════════════════════════════════

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_rol    text := nullif(new.raw_app_meta_data->>'rol', '');
  v_tenant uuid := nullif(new.raw_app_meta_data->>'tenant_id', '')::uuid;
begin
  if v_rol is null or v_rol not in ('master', 'owner', 'member') then
    raise exception 'FixFlow: registro público deshabilitado — los usuarios los crea el taller o el master';
  end if;
  if v_rol <> 'master' and v_tenant is null then
    raise exception 'FixFlow: usuario sin taller asignado';
  end if;

  insert into usuarios (id, tenant_id, email, nombre, rol, debe_cambiar_password)
  values (
    new.id,
    v_tenant,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    v_rol::rol_usuario,
    coalesce((new.raw_user_meta_data->>'debe_cambiar_password')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end $$;
