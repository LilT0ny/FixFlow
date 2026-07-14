-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Inventario, paso 1/2: nuevo valor de enum
-- Postgres no permite usar un valor de enum recién agregado dentro de
-- la misma transacción en la que se lo agrega, y cada migración corre
-- como una transacción — por eso esto va solo, separado del resto del
-- esquema de inventario (20260714020000_v2_inventario_schema.sql).
-- ════════════════════════════════════════════════════════════

alter type modulo_app add value 'inventario';
