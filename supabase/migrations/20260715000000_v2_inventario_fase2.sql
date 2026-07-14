-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Inventario Fase 2: consumo de repuestos en reparaciones
-- Se puede agregar un repuesto a una orden en cualquier momento antes
-- de entregarla (al crearla o después, vía edición) — nunca se edita
-- ni se borra una línea ya agregada; una corrección va por Inventario
-- → Ajustar stock. Mano de obra (orden_trabajo) no se toca.
-- ════════════════════════════════════════════════════════════

-- 1. Repuestos consumidos por una orden — inmutable, mismo criterio que
--    movimientos_inventario/bitacora_auditoria: solo select/insert.
create table orden_repuesto (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) default app_tenant_id(),
  orden_id       uuid not null references ordenes_servicio(id) on delete cascade,
  repuesto_id    uuid not null references repuestos(id),
  cantidad       integer not null check (cantidad > 0),
  costo_unitario numeric(12,2) not null check (costo_unitario >= 0),
  registrado_por uuid references usuarios(id) default auth.uid(),
  created_at     timestamptz not null default now()
);
create index idx_orden_repuesto_orden on orden_repuesto (orden_id);

alter table orden_repuesto enable row level security;

create policy orden_repuesto_select on orden_repuesto for select
  using (tenant_id = app_tenant_id() or app_rol() = 'master');
create policy orden_repuesto_insert on orden_repuesto for insert
  with check (tenant_id = app_tenant_id());

-- 2. crear_orden_completa: nuevo parámetro opcional p_repuestos, mismo
--    patrón de insert en loop que ya usa p_trabajos/p_fotos. Cuerpo
--    idéntico al original (20260707020100_v2_logic.sql:95-175) salvo
--    el insert nuevo hacia orden_repuesto.
create or replace function crear_orden_completa(
  p_cliente      jsonb,
  p_dispositivo  jsonb,
  p_trabajos     jsonb,
  p_falla        text,
  p_abono        numeric     default 0,
  p_metodo_abono metodo_pago default 'efectivo',
  p_fotos        jsonb       default '[]'::jsonb,
  p_repuestos    jsonb       default '[]'::jsonb
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

  insert into orden_repuesto (tenant_id, orden_id, repuesto_id, cantidad, costo_unitario)
  select v_tenant, v_orden_id, (e.value->>'repuesto_id')::uuid,
         coalesce((e.value->>'cantidad')::int, 1),
         (e.value->>'costo_unitario')::numeric
  from jsonb_array_elements(coalesce(p_repuestos, '[]'::jsonb)) e;

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

-- El create-or-replace de arriba resetea la configuración de la función
-- (search_path incluido) a la que tenía al crearse por primera vez en
-- 20260707020100_v2_logic.sql — sin esto se pierde el hardening que
-- 20260707020300_v2_hardening.sql le había aplicado con un ALTER
-- posterior (misma lección de crear_nota_venta en la migración de
-- Inventario Fase 1). Firma nueva: 8 parámetros.
alter function crear_orden_completa(jsonb, jsonb, jsonb, text, numeric, metodo_pago, jsonb, jsonb)
  set search_path = public;

-- 3. Trigger gemelo de fn_descontar_stock_venta (Fase 1), sobre
--    orden_repuesto en vez de nota_venta_item. Sin WHEN: acá
--    repuesto_id es obligatorio, no opcional como en la venta.
create or replace function fn_descontar_stock_reparacion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update repuestos set stock = stock - new.cantidad, updated_at = now()
  where id = new.repuesto_id;

  insert into movimientos_inventario (tenant_id, repuesto_id, tipo, cantidad, motivo, referencia_id, registrado_por)
  values (new.tenant_id, new.repuesto_id, 'salida', new.cantidad, 'reparacion', new.orden_id, new.registrado_por);

  return new;
end;
$$;

create trigger trg_descontar_stock_reparacion
  after insert on orden_repuesto
  for each row execute function fn_descontar_stock_reparacion();

revoke execute on function fn_descontar_stock_reparacion() from public, anon, authenticated;

-- 4. RPC para agregar un repuesto a una orden YA EXISTENTE (después del
--    diagnóstico, por ejemplo) — mismo espíritu transaccional que
--    fn_ajustar_stock: un solo lugar que valida y hace el insert.
create or replace function fn_agregar_repuesto_orden(p_orden_id uuid, p_repuesto_id uuid, p_cantidad int default 1)
returns void
language plpgsql set search_path = public as $$
declare
  v_tenant uuid := app_tenant_id();
  v_precio numeric(12,2);
begin
  if v_tenant is null then
    raise exception 'Sesión sin taller activo';
  end if;
  if p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a cero';
  end if;

  select precio_venta into v_precio from repuestos where id = p_repuesto_id and tenant_id = v_tenant;
  if not found then
    raise exception 'Repuesto no encontrado';
  end if;

  insert into orden_repuesto (tenant_id, orden_id, repuesto_id, cantidad, costo_unitario)
  values (v_tenant, p_orden_id, p_repuesto_id, p_cantidad, v_precio);
end;
$$;

revoke execute on function fn_agregar_repuesto_orden(uuid, uuid, int) from public, anon;
grant execute on function fn_agregar_repuesto_orden(uuid, uuid, int) to authenticated;
