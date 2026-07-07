-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Migración 1/3: limpieza de legacy + esquema
-- Diseño: docs/database-design.md
-- ════════════════════════════════════════════════════════════

-- 1. Limpieza: funciones RPC huérfanas del esquema viejo (las tablas ya no existen)
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'authenticate_user','current_tenant_id','fn_get_tenant_id','fn_require_master',
        'logout_user','rls_auto_enable','rpc_delete_client','rpc_delete_order',
        'rpc_find_client_by_cedula','rpc_get_order_by_id','rpc_get_order_status_public',
        'rpc_get_orders','rpc_get_payments','rpc_master_deactivate_tenant',
        'rpc_master_get_users_by_tenant','rpc_master_toggle_user','rpc_save_client',
        'rpc_save_egreso','rpc_save_ingreso','rpc_save_order','rpc_save_settings',
        'rpc_update_order','rpc_update_order_status','set_tenant_context')
  loop
    execute format('drop function if exists %s cascade', fn.sig);
  end loop;
end $$;

-- 2. Tipos
create type rol_usuario           as enum ('master','owner','member');
create type modulo_app            as enum ('dashboard','registro','dispositivos','ventas',
                                           'clientes','caja','reportes','configuracion','usuarios');
create type alcance_permiso       as enum ('propio','taller');
create type estado_orden          as enum ('recibido','diagnostico','esperando_repuestos',
                                           'listo','entregado','no_reparado');
create type tipo_dispositivo      as enum ('celular','tablet','laptop','impresora','tv','lavadora',
                                           'refrigerador','microondas','cocina','calefon','plancha',
                                           'licuadora','otro');
create type etapa_foto            as enum ('antes','durante','despues');
create type metodo_pago           as enum ('efectivo','transferencia','tarjeta');
create type tipo_transaccion      as enum ('ingreso','egreso');
create type categoria_transaccion as enum ('reparacion','repuestos','arriendo',
                                           'servicios','insumos','otro');
create type tipo_impresora        as enum ('58mm','80mm','A4');

-- 3. Tenants (talleres)
create table tenants (
  id             uuid primary key default gen_random_uuid(),
  nombre_empresa text        not null,
  slug           text        not null unique check (slug ~ '^[a-z0-9-]+$'),
  email          text        not null,
  ruc            text,
  telefono       text,
  direccion      text,
  plan           text        not null default 'basico',
  activo         boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index uq_tenants_email on tenants (lower(email));

-- 4. Usuarios: perfil 1:1 con auth.users (Supabase Auth es la fuente de credenciales)
create table usuarios (
  id                    uuid primary key references auth.users(id) on delete cascade,
  tenant_id             uuid references tenants(id),
  email                 text        not null,
  nombre                text        not null default '',
  rol                   rol_usuario not null default 'member',
  debe_cambiar_password boolean     not null default true,
  activo                boolean     not null default true,
  created_at            timestamptz not null default now(),
  -- master es el único sin taller; owner/member SIEMPRE tienen taller
  constraint usuarios_rol_tenant check (
    (rol = 'master' and tenant_id is null) or
    (rol <> 'master' and tenant_id is not null)
  )
);
create unique index uq_usuarios_email on usuarios (lower(email));
create index idx_usuarios_tenant on usuarios (tenant_id) where tenant_id is not null;

-- Permisos por módulo: solo aplica a rol 'member'. Sin fila = sin acceso al módulo.
create table permisos_modulo (
  usuario_id uuid            not null references usuarios(id) on delete cascade,
  modulo     modulo_app      not null,
  alcance    alcance_permiso not null default 'propio',
  primary key (usuario_id, modulo)
);

-- 5. Ajustes (1:1 con tenant, PK = FK). La marca vive en tenants; acá solo operación.
create table ajustes (
  tenant_id            uuid primary key references tenants(id) on delete cascade,
  logo_url             text,
  whatsapp_template    text not null default '',
  tipo_impresora       tipo_impresora not null default '80mm',
  terminos_condiciones text not null default '',
  updated_at           timestamptz not null default now()
);

-- 6. Clientes — unicidad de cédula POR TALLER (corrige bug D1 del esquema viejo)
create table clientes (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id),
  nombre_completo text not null,
  cedula          text not null,
  telefono        text not null default '',
  email           text,
  direccion       text,
  created_at      timestamptz not null default now(),
  unique (tenant_id, cedula)
);
create index idx_clientes_tenant_nombre on clientes (tenant_id, nombre_completo);

-- 7. Dispositivos
create table dispositivos (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id),
  cliente_id     uuid not null references clientes(id),
  tipo           tipo_dispositivo not null default 'celular',
  marca          text not null,
  modelo         text not null,
  imei_sn        text,
  estado_fisico  text not null default '',
  registrado_por uuid references usuarios(id),
  created_at     timestamptz not null default now()
);
create index idx_dispositivos_tenant_imei on dispositivos (tenant_id, imei_sn);
create index idx_dispositivos_cliente     on dispositivos (cliente_id);

-- 8. Órdenes de servicio (cliente derivado vía dispositivo; dinero en orden_trabajo/transacciones)
create table ordenes_servicio (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id),
  numero_orden    text not null,
  dispositivo_id  uuid not null references dispositivos(id),
  falla_reportada text not null,
  estado          estado_orden not null default 'recibido',
  creado_por      uuid references usuarios(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique (tenant_id, numero_orden)
);
create index idx_ordenes_tenant_estado on ordenes_servicio (tenant_id, estado) where deleted_at is null;
create index idx_ordenes_tenant_fecha  on ordenes_servicio (tenant_id, created_at desc);
create index idx_ordenes_dispositivo   on ordenes_servicio (dispositivo_id);

create table orden_trabajo (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id),
  orden_id    uuid not null references ordenes_servicio(id) on delete cascade,
  descripcion text not null,
  costo       numeric(12,2) not null check (costo >= 0)
);
create index idx_trabajo_orden on orden_trabajo (orden_id);

create table historial_estado_orden (
  id               bigint generated always as identity primary key,
  tenant_id        uuid not null references tenants(id),
  orden_id         uuid not null references ordenes_servicio(id) on delete cascade,
  estado_anterior  estado_orden,
  estado_nuevo     estado_orden not null,
  cambiado_por     uuid references usuarios(id),
  whatsapp_enviado boolean not null default false,
  created_at       timestamptz not null default now()
);
create index idx_historial_orden on historial_estado_orden (orden_id, created_at);

create table fotos_evidencia (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id),
  orden_id   uuid not null references ordenes_servicio(id) on delete cascade,
  etapa      etapa_foto not null,
  url_foto   text not null,
  created_at timestamptz not null default now()
);
create index idx_fotos_orden on fotos_evidencia (orden_id);

-- 9. Notas de venta + items
create table notas_venta (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id),
  numero_nota text not null,
  cliente_id  uuid references clientes(id),
  orden_id    uuid references ordenes_servicio(id),
  metodo_pago metodo_pago not null default 'efectivo',
  creado_por  uuid references usuarios(id),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (tenant_id, numero_nota)
);
create index idx_notas_tenant_fecha on notas_venta (tenant_id, created_at desc);

create table nota_venta_item (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id),
  nota_venta_id   uuid not null references notas_venta(id) on delete cascade,
  descripcion     text not null,
  cantidad        integer not null default 1 check (cantidad > 0),
  precio_unitario numeric(12,2) not null check (precio_unitario >= 0)
);
create index idx_item_nota on nota_venta_item (nota_venta_id);

-- 10. Transacciones (unifica ingresos + egresos; egreso jamás lleva vínculos)
create table transacciones (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id),
  tipo           tipo_transaccion not null,
  monto          numeric(12,2) not null check (monto > 0),
  metodo         metodo_pago not null,
  categoria      categoria_transaccion not null,
  descripcion    text not null default '',
  orden_id       uuid references ordenes_servicio(id),
  cliente_id     uuid references clientes(id),
  nota_venta_id  uuid references notas_venta(id),
  registrado_por uuid references usuarios(id),
  fecha          timestamptz not null default now(),
  constraint egreso_sin_vinculos check (
    tipo = 'ingreso' or
    (orden_id is null and cliente_id is null and nota_venta_id is null)
  )
);
create index idx_trans_tenant_fecha on transacciones (tenant_id, fecha desc);
create index idx_trans_orden        on transacciones (orden_id) where orden_id is not null;

-- 11. Contadores por tenant (numeración REP-00001 / NT-00001)
create table contadores (
  tenant_id uuid   not null references tenants(id),
  serie     text   not null,
  valor     bigint not null default 0,
  primary key (tenant_id, serie)
);
