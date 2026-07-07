-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Migración 3/3: RLS + storage
-- Regla: aislamiento por tenant en RLS (servidor). El detalle de
-- permisos por módulo/alcance es capa de aplicación.
-- ════════════════════════════════════════════════════════════

-- 1. Habilitar RLS en todo
alter table tenants                enable row level security;
alter table usuarios               enable row level security;
alter table permisos_modulo        enable row level security;
alter table ajustes                enable row level security;
alter table clientes               enable row level security;
alter table dispositivos           enable row level security;
alter table ordenes_servicio       enable row level security;
alter table orden_trabajo          enable row level security;
alter table historial_estado_orden enable row level security;
alter table fotos_evidencia        enable row level security;
alter table notas_venta            enable row level security;
alter table nota_venta_item        enable row level security;
alter table transacciones          enable row level security;
alter table contadores             enable row level security;

-- 2. Tenants: master administra; el taller ve/edita su propia fila
create policy tenants_select on tenants for select
  using (app_rol() = 'master' or id = app_tenant_id());
create policy tenants_insert on tenants for insert
  with check (app_rol() = 'master');
create policy tenants_update on tenants for update
  using (app_rol() = 'master' or (app_rol() = 'owner' and id = app_tenant_id()));

-- 3. Usuarios: cada uno se ve a sí mismo; owner ve/gestiona su taller; master ve todo
create policy usuarios_select on usuarios for select
  using (id = auth.uid()
         or app_rol() = 'master'
         or (app_rol() = 'owner' and tenant_id = app_tenant_id()));
create policy usuarios_update on usuarios for update
  using (id = auth.uid()
         or (app_rol() = 'owner' and tenant_id = app_tenant_id())
         or app_rol() = 'master');
-- insert lo hace el trigger handle_new_user (security definer); no hay policy de insert

-- 4. Permisos por módulo: owner del taller los administra
create policy permisos_select on permisos_modulo for select
  using (usuario_id = auth.uid()
         or app_rol() = 'master'
         or (app_rol() = 'owner' and exists (
              select 1 from usuarios u
              where u.id = permisos_modulo.usuario_id and u.tenant_id = app_tenant_id())));
create policy permisos_write on permisos_modulo for all
  using (app_rol() = 'owner' and exists (
           select 1 from usuarios u
           where u.id = permisos_modulo.usuario_id and u.tenant_id = app_tenant_id()))
  with check (app_rol() = 'owner' and exists (
           select 1 from usuarios u
           where u.id = permisos_modulo.usuario_id and u.tenant_id = app_tenant_id()));

-- 5. Ajustes: el taller lee; solo owner escribe
create policy ajustes_select on ajustes for select
  using (tenant_id = app_tenant_id() or app_rol() = 'master');
create policy ajustes_write on ajustes for all
  using (app_rol() = 'owner' and tenant_id = app_tenant_id())
  with check (app_rol() = 'owner' and tenant_id = app_tenant_id());

-- 6. Datos operativos: aislamiento por tenant + lectura de monitoreo para master.
--    Master NO tiene políticas de escritura sobre datos operativos (solo lectura).
do $$
declare t text;
begin
  foreach t in array array['clientes','dispositivos','ordenes_servicio','orden_trabajo',
                           'historial_estado_orden','fotos_evidencia','notas_venta',
                           'nota_venta_item','transacciones','contadores']
  loop
    execute format($p$
      create policy %1$s_select on %1$s for select
        using (tenant_id = app_tenant_id() or app_rol() = 'master');
      create policy %1$s_insert on %1$s for insert
        with check (tenant_id = app_tenant_id());
      create policy %1$s_update on %1$s for update
        using (tenant_id = app_tenant_id())
        with check (tenant_id = app_tenant_id());
      create policy %1$s_delete on %1$s for delete
        using (tenant_id = app_tenant_id() and app_rol() = 'owner');
    $p$, t);
  end loop;
end $$;

-- 7. Storage: logos públicos, evidencias privadas por tenant.
--    Convención de path: {tenant_id}/resto-del-path
insert into storage.buckets (id, name, public) values ('logos', 'logos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('evidencias', 'evidencias', false)
  on conflict (id) do nothing;

create policy evidencias_select on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and (storage.foldername(name))[1] = app_tenant_id()::text);
create policy evidencias_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and (storage.foldername(name))[1] = app_tenant_id()::text);
create policy evidencias_delete on storage.objects for delete to authenticated
  using (bucket_id = 'evidencias' and (storage.foldername(name))[1] = app_tenant_id()::text);

create policy logos_select on storage.objects for select
  using (bucket_id = 'logos');
create policy logos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = app_tenant_id()::text);
create policy logos_update on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = app_tenant_id()::text);
create policy logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = app_tenant_id()::text);
