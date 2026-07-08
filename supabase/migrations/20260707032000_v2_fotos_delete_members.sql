-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Migración 8: los members gestionan evidencias
-- Las fotos de evidencia son datos operativos del día a día:
-- el técnico que las sube debe poder reemplazarlas/borrarlas.
-- El resto de tablas mantiene delete solo-owner.
-- ════════════════════════════════════════════════════════════

drop policy fotos_evidencia_delete on fotos_evidencia;

create policy fotos_evidencia_delete on fotos_evidencia for delete
  using (tenant_id = app_tenant_id());
