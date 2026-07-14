-- Recuperada desde producción (supabase_migrations.schema_migrations) el
-- 2026-07-13: esta migración se había aplicado directo al proyecto sin
-- quedar versionada en el repo. Contenido verbatim, sin modificaciones.

create table if not exists public.login_intentos (
  email text primary key,
  intentos int not null default 0,
  bloqueado_hasta timestamptz
);

alter table public.login_intentos enable row level security;
-- Sin policies: solo accesible via las funciones SECURITY DEFINER de abajo.

create or replace function public.fn_check_login_lock(p_email text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_hasta timestamptz;
begin
  select bloqueado_hasta into v_hasta
  from login_intentos where email = lower(p_email);

  if v_hasta is not null and v_hasta > now() then
    raise exception 'Cuenta bloqueada temporalmente. Intentá de nuevo en % minutos.',
      greatest(1, ceil(extract(epoch from (v_hasta - now())) / 60))
      using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.fn_record_login_attempt(p_email text, p_exito boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_max_intentos     constant int := 5;
  v_bloqueo_minutos  constant int := 15;
  v_intentos         int;
begin
  if p_exito then
    delete from login_intentos where email = lower(p_email);
    return;
  end if;

  insert into login_intentos (email, intentos)
  values (lower(p_email), 1)
  on conflict (email) do update set intentos = login_intentos.intentos + 1
  returning intentos into v_intentos;

  if v_intentos >= v_max_intentos then
    update login_intentos
       set bloqueado_hasta = now() + (v_bloqueo_minutos || ' minutes')::interval,
           intentos = 0
     where email = lower(p_email);
    raise exception 'Cuenta bloqueada temporalmente. Intentá de nuevo en % minutos.', v_bloqueo_minutos
      using errcode = 'P0002';
  else
    raise exception 'Contraseña incorrecta. % intento(s) restante(s) antes del bloqueo automático.',
      (v_max_intentos - v_intentos)
      using errcode = 'P0003';
  end if;
end;
$$;

grant execute on function public.fn_check_login_lock(text) to anon, authenticated;
grant execute on function public.fn_record_login_attempt(text, boolean) to anon, authenticated;
