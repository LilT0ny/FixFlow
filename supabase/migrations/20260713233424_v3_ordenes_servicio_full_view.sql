-- Recuperada desde producción (supabase_migrations.schema_migrations) el
-- 2026-07-13: esta migración se había aplicado directo al proyecto sin
-- quedar versionada en el repo. Contenido verbatim, sin modificaciones.

create or replace view public.ordenes_servicio_full
with (security_invoker = true) as
select
  o.id,
  o.tenant_id,
  o.numero_orden,
  o.dispositivo_id,
  o.falla_reportada,
  o.estado,
  o.creado_por,
  o.created_at,
  o.updated_at,
  o.deleted_at,
  coalesce(wt.costo_total, 0) as costo_total,
  coalesce(pg.abono, 0)       as abono,
  d.marca            as disp_marca,
  d.modelo           as disp_modelo,
  d.imei_sn          as disp_imei_sn,
  d.tipo             as disp_tipo,
  d.estado_fisico    as disp_estado_fisico,
  d.cliente_id       as disp_cliente_id,
  c.nombre_completo  as cli_nombre_completo,
  c.cedula           as cli_cedula,
  c.telefono         as cli_telefono,
  c.direccion        as cli_direccion,
  c.email            as cli_email,
  coalesce(fe.fotos, '[]'::jsonb) as fotos
from ordenes_servicio o
left join dispositivos d on d.id = o.dispositivo_id
left join clientes c on c.id = d.cliente_id
left join lateral (
  select sum(costo) as costo_total from orden_trabajo where orden_id = o.id
) wt on true
left join lateral (
  select sum(monto) as abono from transacciones where orden_id = o.id and categoria = 'reparacion'
) pg on true
left join lateral (
  select jsonb_agg(jsonb_build_object('etapa', etapa, 'url_foto', url_foto) order by created_at) as fotos
  from fotos_evidencia where orden_id = o.id
) fe on true;
