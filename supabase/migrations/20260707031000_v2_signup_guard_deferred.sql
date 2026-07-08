-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Migración 7: guard de signup como constraint
-- trigger DIFERIDO.
-- GoTrue (admin API) inserta el usuario y recién después setea
-- app_metadata DENTRO de la misma transacción → un AFTER INSERT
-- inmediato ve la fila sin rol y rechaza también al admin.
-- Diferido al COMMIT, el trigger relee la fila en su estado final:
--   · signup público  → sin rol al commit → rechazado
--   · admin API/seed  → rol+tenant al commit → perfil creado
-- ════════════════════════════════════════════════════════════

drop trigger if exists trg_on_auth_user_created on auth.users;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_meta   jsonb;
  v_email  text;
  v_nombre text;
  v_debe   boolean;
  v_rol    text;
  v_tenant uuid;
begin
  -- Releer el estado FINAL de la fila (trigger diferido al commit)
  select u.raw_app_meta_data, u.email,
         coalesce(u.raw_user_meta_data->>'nombre', ''),
         coalesce((u.raw_user_meta_data->>'debe_cambiar_password')::boolean, true)
    into v_meta, v_email, v_nombre, v_debe
  from auth.users u where u.id = new.id;

  if not found then
    return null; -- la fila se borró dentro de la misma transacción
  end if;

  v_rol    := nullif(v_meta->>'rol', '');
  v_tenant := nullif(v_meta->>'tenant_id', '')::uuid;

  if v_rol is null or v_rol not in ('master', 'owner', 'member') then
    raise exception 'FixFlow: registro público deshabilitado — los usuarios los crea el taller o el master';
  end if;
  if v_rol <> 'master' and v_tenant is null then
    raise exception 'FixFlow: usuario sin taller asignado';
  end if;

  insert into usuarios (id, tenant_id, email, nombre, rol, debe_cambiar_password)
  values (new.id, v_tenant, v_email, v_nombre, v_rol::rol_usuario, v_debe)
  on conflict (id) do nothing;
  return null;
end $$;

create constraint trigger trg_on_auth_user_created
  after insert on auth.users
  deferrable initially deferred
  for each row execute function handle_new_user();
