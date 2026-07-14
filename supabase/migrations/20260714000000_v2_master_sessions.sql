-- ════════════════════════════════════════════════════════════
-- FixFlow v2 — Panel de sesiones para Master Admin
-- Supabase Auth ya guarda ip/user_agent por sesión en auth.sessions;
-- esta función solo lo expone de forma segura (master-only) para que
-- el dueño del SaaS pueda revisar manualmente si un tenant del Plan
-- Básico está compartiendo credenciales entre varias sucursales.
-- No es un bloqueo automático — mismo criterio honor-system de siempre.
-- ════════════════════════════════════════════════════════════

create or replace function fn_listar_sesiones_recientes(p_dias int default 30)
returns table (
  usuario_id uuid,
  usuario_nombre text,
  usuario_email text,
  tenant_id uuid,
  tenant_nombre text,
  ip text,
  user_agent text,
  created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if app_rol() <> 'master' then
    raise exception 'Solo el master puede ver las sesiones';
  end if;

  return query
  select
    u.id, u.nombre, u.email,
    t.id, t.nombre_empresa,
    s.ip::text, s.user_agent, s.created_at
  from auth.sessions s
  join public.usuarios u on u.id = s.user_id
  left join public.tenants t on t.id = u.tenant_id
  where s.created_at > now() - (p_dias || ' days')::interval
  order by t.nombre_empresa nulls last, s.created_at desc;
end;
$$;

revoke execute on function fn_listar_sesiones_recientes(int) from public, anon;
grant execute on function fn_listar_sesiones_recientes(int) to authenticated;
