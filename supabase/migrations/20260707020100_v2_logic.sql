-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Migración 2/3: helpers, triggers, vistas y RPCs
-- ════════════════════════════════════════════════════════════

-- 1. Helpers de sesión (security definer: leen usuarios sin recursión de RLS)
create or replace function app_tenant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from usuarios where id = auth.uid() and activo
$$;

create or replace function app_rol() returns rol_usuario
language sql stable security definer set search_path = public as $$
  select rol from usuarios where id = auth.uid() and activo
$$;

grant execute on function app_tenant_id(), app_rol() to authenticated, anon;

-- 2. Perfil automático al crear usuario en Supabase Auth.
--    tenant_id y rol viajan en app_metadata (los setea el admin API / dashboard, NUNCA el cliente).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into usuarios (id, tenant_id, email, nombre, rol, debe_cambiar_password)
  values (
    new.id,
    nullif(new.raw_app_meta_data->>'tenant_id','')::uuid,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre',''),
    coalesce(nullif(new.raw_app_meta_data->>'rol',''),'member')::rol_usuario,
    coalesce((new.raw_user_meta_data->>'debe_cambiar_password')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3. Historial de estados automático (nadie puede "olvidarse" de registrarlo)
create or replace function fn_log_estado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into historial_estado_orden (tenant_id, orden_id, estado_anterior, estado_nuevo, cambiado_por)
    values (new.tenant_id, new.id, null, new.estado, coalesce(new.creado_por, auth.uid()));
  elsif new.estado is distinct from old.estado then
    insert into historial_estado_orden (tenant_id, orden_id, estado_anterior, estado_nuevo, cambiado_por)
    values (new.tenant_id, new.id, old.estado, new.estado, auth.uid());
  end if;
  return new;
end $$;

create trigger trg_orden_estado
  after insert or update of estado on ordenes_servicio
  for each row execute function fn_log_estado();

-- 4. updated_at automático
create or replace function fn_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_touch_ordenes before update on ordenes_servicio for each row execute function fn_touch();
create trigger trg_touch_tenants before update on tenants          for each row execute function fn_touch();
create trigger trg_touch_ajustes before update on ajustes          for each row execute function fn_touch();

-- 5. Numeración por tenant
create or replace function siguiente_numero(p_tenant uuid, p_serie text)
returns text language sql volatile as $$
  insert into contadores (tenant_id, serie, valor) values (p_tenant, p_serie, 1)
  on conflict (tenant_id, serie) do update set valor = contadores.valor + 1
  returning p_serie || '-' || lpad(valor::text, 5, '0')
$$;

-- 6. Vistas (security_invoker: respetan RLS del usuario que consulta)
create view v_orden_saldo with (security_invoker = on) as
select
  o.id as orden_id,
  o.tenant_id,
  coalesce(t.total, 0)   as costo_total,
  coalesce(i.abonado, 0) as abonado,
  coalesce(t.total, 0) - coalesce(i.abonado, 0) as saldo
from ordenes_servicio o
left join (select orden_id, sum(costo) as total from orden_trabajo group by 1) t
       on t.orden_id = o.id
left join (select orden_id, sum(monto) as abonado from transacciones
           where tipo = 'ingreso' and orden_id is not null group by 1) i
       on i.orden_id = o.id;

create view v_nota_venta_total with (security_invoker = on) as
select nota_venta_id, sum(cantidad * precio_unitario) as total
from nota_venta_item group by 1;

-- 7. RPC transaccional: wizard de 3 pasos (cliente + dispositivo + trabajos + orden
--    + abono + fotos). Todo o nada. security invoker: RLS aplica en cada insert.
create or replace function crear_orden_completa(
  p_cliente      jsonb,
  p_dispositivo  jsonb,
  p_trabajos     jsonb,
  p_falla        text,
  p_abono        numeric     default 0,
  p_metodo_abono metodo_pago default 'efectivo',
  p_fotos        jsonb       default '[]'::jsonb
) returns jsonb
language plpgsql as $$
declare
  v_tenant      uuid := app_tenant_id();
  v_cliente     uuid;
  v_dispositivo uuid;
  v_orden_id    uuid;
  v_numero      text;
begin
  if v_tenant is null then
    raise exception 'Sesión sin taller activo';
  end if;
  if p_falla is null or btrim(p_falla) = '' then
    raise exception 'La falla reportada es obligatoria';
  end if;
  if coalesce(jsonb_array_length(p_trabajos), 0) = 0 then
    raise exception 'Debe registrar al menos un trabajo con su costo';
  end if;

  insert into clientes (tenant_id, nombre_completo, cedula, telefono, email, direccion)
  values (
    v_tenant,
    p_cliente->>'nombre_completo',
    p_cliente->>'cedula',
    coalesce(p_cliente->>'telefono',''),
    nullif(p_cliente->>'email',''),
    p_cliente->>'direccion'
  )
  on conflict (tenant_id, cedula) do update
    set nombre_completo = excluded.nombre_completo,
        telefono        = excluded.telefono,
        email           = coalesce(excluded.email, clientes.email),
        direccion       = coalesce(excluded.direccion, clientes.direccion)
  returning id into v_cliente;

  insert into dispositivos (tenant_id, cliente_id, tipo, marca, modelo, imei_sn, estado_fisico, registrado_por)
  values (
    v_tenant, v_cliente,
    coalesce(nullif(p_dispositivo->>'tipo',''), 'otro')::tipo_dispositivo,
    p_dispositivo->>'marca',
    p_dispositivo->>'modelo',
    nullif(p_dispositivo->>'imei_sn',''),
    coalesce(p_dispositivo->>'estado_fisico',''),
    auth.uid()
  )
  returning id into v_dispositivo;

  v_numero := siguiente_numero(v_tenant, 'REP');

  insert into ordenes_servicio (tenant_id, numero_orden, dispositivo_id, falla_reportada, creado_por)
  values (v_tenant, v_numero, v_dispositivo, p_falla, auth.uid())
  returning id into v_orden_id;

  insert into orden_trabajo (tenant_id, orden_id, descripcion, costo)
  select v_tenant, v_orden_id, e.value->>'descripcion', (e.value->>'costo')::numeric
  from jsonb_array_elements(p_trabajos) e;

  insert into fotos_evidencia (tenant_id, orden_id, etapa, url_foto)
  select v_tenant, v_orden_id, (e.value->>'etapa')::etapa_foto, e.value->>'url_foto'
  from jsonb_array_elements(coalesce(p_fotos, '[]'::jsonb)) e;

  if coalesce(p_abono, 0) > 0 then
    insert into transacciones (tenant_id, tipo, monto, metodo, categoria, descripcion,
                               orden_id, cliente_id, registrado_por)
    values (v_tenant, 'ingreso', p_abono, p_metodo_abono, 'reparacion',
            'ABONO INICIAL - ORDEN ' || v_numero, v_orden_id, v_cliente, auth.uid());
  end if;

  return jsonb_build_object(
    'orden_id', v_orden_id, 'numero_orden', v_numero,
    'cliente_id', v_cliente, 'dispositivo_id', v_dispositivo
  );
end $$;

-- 8. RPC transaccional: nota de venta (con o sin cliente/orden) + items + ingreso
create or replace function crear_nota_venta(
  p_items       jsonb,
  p_metodo      metodo_pago default 'efectivo',
  p_cliente_id  uuid default null,
  p_orden_id    uuid default null,
  p_registrar_ingreso boolean default true
) returns jsonb
language plpgsql as $$
declare
  v_tenant uuid := app_tenant_id();
  v_nota   uuid;
  v_numero text;
  v_total  numeric(12,2);
begin
  if v_tenant is null then
    raise exception 'Sesión sin taller activo';
  end if;
  if coalesce(jsonb_array_length(p_items), 0) = 0 then
    raise exception 'La nota de venta necesita al menos un item';
  end if;

  v_numero := siguiente_numero(v_tenant, 'NT');

  insert into notas_venta (tenant_id, numero_nota, cliente_id, orden_id, metodo_pago, creado_por)
  values (v_tenant, v_numero, p_cliente_id, p_orden_id, p_metodo, auth.uid())
  returning id into v_nota;

  insert into nota_venta_item (tenant_id, nota_venta_id, descripcion, cantidad, precio_unitario)
  select v_tenant, v_nota,
         e.value->>'descripcion',
         coalesce((e.value->>'cantidad')::int, 1),
         (e.value->>'precio_unitario')::numeric
  from jsonb_array_elements(p_items) e;

  select sum(cantidad * precio_unitario) into v_total
  from nota_venta_item where nota_venta_id = v_nota;

  if p_registrar_ingreso then
    insert into transacciones (tenant_id, tipo, monto, metodo, categoria, descripcion,
                               nota_venta_id, cliente_id, registrado_por)
    values (v_tenant, 'ingreso', v_total, p_metodo, 'repuestos',
            'VENTA DIRECTA - NOTA ' || v_numero, v_nota, p_cliente_id, auth.uid());
  end if;

  return jsonb_build_object('nota_id', v_nota, 'numero_nota', v_numero, 'total', v_total);
end $$;

-- 9. Portal público /status/:orden — único acceso anónimo, requiere numero + cédula
create or replace function consultar_orden_publica(p_numero text, p_cedula text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'numero_orden', o.numero_orden,
    'estado',       o.estado,
    'taller',       t.nombre_empresa,
    'dispositivo',  d.marca || ' ' || d.modelo,
    'creado',       o.created_at,
    'historial', (
      select jsonb_agg(jsonb_build_object('estado', h.estado_nuevo, 'fecha', h.created_at)
                       order by h.created_at)
      from historial_estado_orden h where h.orden_id = o.id
    )
  )
  from ordenes_servicio o
  join dispositivos d on d.id = o.dispositivo_id
  join clientes     c on c.id = d.cliente_id
  join tenants      t on t.id = o.tenant_id
  where o.numero_orden = p_numero
    and c.cedula = p_cedula
    and o.deleted_at is null
  limit 1
$$;

grant execute on function consultar_orden_publica(text, text) to anon, authenticated;
