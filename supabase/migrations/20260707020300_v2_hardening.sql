-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Migración 4/4: hardening (hallazgos de get_advisors)
-- ════════════════════════════════════════════════════════════

-- 1. search_path fijo en todas las funciones (lint 0011)
alter function fn_touch()                         set search_path = public;
alter function siguiente_numero(uuid, text)       set search_path = public;
alter function crear_orden_completa(jsonb, jsonb, jsonb, text, numeric, metodo_pago, jsonb)
                                                  set search_path = public;
alter function crear_nota_venta(jsonb, metodo_pago, uuid, uuid, boolean)
                                                  set search_path = public;

-- 2. Las funciones de trigger no son API: nadie las llama por PostgREST (lints 0028/0029)
revoke execute on function fn_log_estado()    from public, anon, authenticated;
revoke execute on function handle_new_user()  from public, anon, authenticated;
revoke execute on function fn_touch()         from public, anon, authenticated;

-- 3. Helpers de sesión: authenticated los necesita (los evalúan las políticas RLS),
--    anon no tiene ninguna razón para ejecutarlos
revoke execute on function app_tenant_id() from public, anon;
revoke execute on function app_rol()       from public, anon;

-- 4. RPCs transaccionales: solo usuarios logueados
revoke execute on function crear_orden_completa(jsonb, jsonb, jsonb, text, numeric, metodo_pago, jsonb)
  from public, anon;
revoke execute on function crear_nota_venta(jsonb, metodo_pago, uuid, uuid, boolean)
  from public, anon;

-- 5. Bucket público 'logos': el acceso es por URL pública del objeto;
--    la policy de SELECT solo habilitaba LISTAR todos los archivos (lint 0025)
drop policy logos_select on storage.objects;
