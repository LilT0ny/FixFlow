-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Migración 5: defaults de sesión
-- El cliente NUNCA manda tenant_id ni registrado_por: los pone
-- el servidor (default) y RLS los valida. Menos código, menos bugs.
-- ════════════════════════════════════════════════════════════

alter table ajustes                alter column tenant_id set default app_tenant_id();
alter table clientes               alter column tenant_id set default app_tenant_id();
alter table dispositivos           alter column tenant_id set default app_tenant_id();
alter table ordenes_servicio       alter column tenant_id set default app_tenant_id();
alter table orden_trabajo          alter column tenant_id set default app_tenant_id();
alter table historial_estado_orden alter column tenant_id set default app_tenant_id();
alter table fotos_evidencia        alter column tenant_id set default app_tenant_id();
alter table notas_venta            alter column tenant_id set default app_tenant_id();
alter table nota_venta_item        alter column tenant_id set default app_tenant_id();
alter table transacciones          alter column tenant_id set default app_tenant_id();
alter table contadores             alter column tenant_id set default app_tenant_id();

alter table dispositivos     alter column registrado_por set default auth.uid();
alter table transacciones    alter column registrado_por set default auth.uid();
alter table ordenes_servicio alter column creado_por     set default auth.uid();
alter table notas_venta      alter column creado_por     set default auth.uid();

-- Evidencias: acceso por URL directa (como la app siempre funcionó), sin listado
-- público — el bucket es público pero solo el tenant puede listar/subir/borrar
-- su carpeta (policies de la migración 3).
update storage.buckets set public = true where id = 'evidencias';
