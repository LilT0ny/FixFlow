-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Inventario, paso 2/2: esquema
-- Fase 1: catálogo de repuestos con stock real + historial de
-- movimientos auditado, integrado a Notas de Venta. El consumo de
-- repuestos en reparaciones (Fase 2) queda para más adelante.
-- ════════════════════════════════════════════════════════════

-- 1. Catálogo de repuestos
create table repuestos (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) default app_tenant_id(),
  nombre       text not null,
  sku          text,
  costo        numeric(12,2) not null default 0 check (costo >= 0),
  precio_venta numeric(12,2) not null default 0 check (precio_venta >= 0),
  stock        integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_repuestos_tenant_nombre on repuestos (tenant_id, nombre);

alter table repuestos enable row level security;

create policy repuestos_select on repuestos for select
  using (tenant_id = app_tenant_id() or app_rol() = 'master');
create policy repuestos_insert on repuestos for insert
  with check (tenant_id = app_tenant_id());
create policy repuestos_update on repuestos for update
  using (tenant_id = app_tenant_id())
  with check (tenant_id = app_tenant_id());
create policy repuestos_delete on repuestos for delete
  using (tenant_id = app_tenant_id() and app_rol() = 'owner');

-- 2. Historial de movimientos — inmutable, mismo criterio que
--    bitacora_auditoria: solo select/insert, sin update/delete.
create table movimientos_inventario (
  id             bigint generated always as identity primary key,
  tenant_id      uuid not null references tenants(id),
  repuesto_id    uuid not null references repuestos(id),
  tipo           text not null check (tipo in ('entrada', 'salida', 'ajuste')),
  cantidad       integer not null check (cantidad > 0),
  motivo         text not null,
  referencia_id  uuid,
  registrado_por uuid references usuarios(id),
  created_at     timestamptz not null default now()
);
create index idx_movs_tenant_repuesto on movimientos_inventario (tenant_id, repuesto_id, created_at desc);

alter table movimientos_inventario enable row level security;

create policy movimientos_inventario_select on movimientos_inventario for select
  using (tenant_id = app_tenant_id() or app_rol() = 'master');
create policy movimientos_inventario_insert on movimientos_inventario for insert
  with check (tenant_id = app_tenant_id());

-- 3. Vínculo opcional de un ítem de venta a un repuesto del catálogo.
--    Nullable a propósito: una venta puede seguir teniendo ítems libres,
--    sin catálogo, exactamente como hoy.
alter table nota_venta_item add column repuesto_id uuid references repuestos(id);

-- 4. crear_nota_venta: passthrough de repuesto_id (única vía de inserción
--    de nota_venta_item hoy). Idéntica a la versión anterior salvo esa
--    columna nueva en el insert.
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

  insert into nota_venta_item (tenant_id, nota_venta_id, descripcion, cantidad, precio_unitario, repuesto_id)
  select v_tenant, v_nota,
         e.value->>'descripcion',
         coalesce((e.value->>'cantidad')::int, 1),
         (e.value->>'precio_unitario')::numeric,
         (e.value->>'repuesto_id')::uuid
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

-- El create-or-replace de arriba resetea la configuración de la función
-- (incluido search_path) a la que tenía cuando se creó por primera vez
-- en 20260707020100_v2_logic.sql — sin esto, se pierde el hardening que
-- 20260707020300_v2_hardening.sql le había aplicado con un ALTER posterior.
alter function crear_nota_venta(jsonb, metodo_pago, uuid, uuid, boolean) set search_path = public;

-- 5. Trigger: descuenta stock y audita el movimiento cuando un ítem de
--    venta viene vinculado a un repuesto. Mismo criterio que
--    fn_log_estado/fn_log_auditoria: trigger sobre la tabla, no lógica
--    embebida en la RPC — así cubre cualquier vía futura de inserción
--    (ej. Fase 2, consumo en reparaciones) sin duplicar código.
--    El check (stock >= 0) de repuestos actúa como freno duro ante
--    sobreventa.
create or replace function fn_descontar_stock_venta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update repuestos set stock = stock - new.cantidad, updated_at = now()
  where id = new.repuesto_id;

  insert into movimientos_inventario (tenant_id, repuesto_id, tipo, cantidad, motivo, referencia_id, registrado_por)
  values (new.tenant_id, new.repuesto_id, 'salida', new.cantidad, 'venta', new.nota_venta_id, auth.uid());

  return new;
end;
$$;

create trigger trg_descontar_stock_venta
  after insert on nota_venta_item
  for each row when (new.repuesto_id is not null)
  execute function fn_descontar_stock_venta();

revoke execute on function fn_descontar_stock_venta() from public, anon, authenticated;

-- 6. RPC de reposición/ajuste manual de stock (Inventario → ajustar).
--    Transaccional: actualiza stock y audita el movimiento en un solo
--    lugar. No es security definer — corre con los permisos normales
--    del usuario, protegido por las RLS ya declaradas arriba.
create or replace function fn_ajustar_stock(p_repuesto_id uuid, p_cantidad int, p_motivo text)
returns void
language plpgsql set search_path = public as $$
declare
  v_tenant uuid := app_tenant_id();
begin
  if v_tenant is null then
    raise exception 'Sesión sin taller activo';
  end if;
  if p_cantidad = 0 then
    raise exception 'La cantidad del ajuste no puede ser cero';
  end if;

  update repuestos set stock = stock + p_cantidad, updated_at = now()
  where id = p_repuesto_id and tenant_id = v_tenant;

  if not found then
    raise exception 'Repuesto no encontrado';
  end if;

  insert into movimientos_inventario (tenant_id, repuesto_id, tipo, cantidad, motivo, registrado_por)
  values (
    v_tenant, p_repuesto_id,
    case when p_cantidad > 0 then 'entrada' else 'ajuste' end,
    abs(p_cantidad), p_motivo, auth.uid()
  );
end;
$$;

revoke execute on function fn_ajustar_stock(uuid, int, text) from public, anon;
grant execute on function fn_ajustar_stock(uuid, int, text) to authenticated;
