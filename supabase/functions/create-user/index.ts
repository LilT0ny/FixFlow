// Edge Function: create-user
// Crea usuarios de la plataforma con el admin API (service role).
// Autorización: master crea owners/members en cualquier taller;
// owner crea members SOLO en su propio taller. Nadie más.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Identificar al caller por su JWT
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !caller) {
      return json({ error: 'No autenticado' }, 401);
    }

    const { data: perfil } = await admin
      .from('usuarios')
      .select('rol, tenant_id, activo')
      .eq('id', caller.id)
      .single();

    if (!perfil || !perfil.activo) {
      return json({ error: 'Perfil inválido o desactivado' }, 403);
    }

    // 2. Autorización por rol
    const body = await req.json();
    let tenantId: string | null;
    let rol: string;

    if (perfil.rol === 'master') {
      tenantId = body.tenant_id ?? null;
      rol = body.rol ?? 'member';
    } else if (perfil.rol === 'owner') {
      tenantId = perfil.tenant_id;   // el owner solo crea en SU taller
      rol = 'member';                 // y solo members
    } else {
      return json({ error: 'Sin permisos para crear usuarios' }, 403);
    }

    if (rol !== 'master' && !tenantId) {
      return json({ error: 'tenant_id es requerido para owners y members' }, 400);
    }
    if (!body.email || !body.password || body.password.length < 8) {
      return json({ error: 'Email y contraseña (mínimo 8 caracteres) son requeridos' }, 400);
    }

    // 3. Crear el usuario: el trigger handle_new_user crea el perfil en usuarios
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: String(body.email).toLowerCase(),
      password: body.password,
      email_confirm: true,
      app_metadata: { tenant_id: tenantId, rol },
      user_metadata: { nombre: body.nombre ?? '', debe_cambiar_password: true },
    });

    if (createError) {
      const msg = createError.message.includes('already')
        ? 'El correo ya está registrado'
        : createError.message;
      return json({ error: msg }, 400);
    }

    const { data: usuario } = await admin
      .from('usuarios')
      .select('id, email, nombre, rol, tenant_id, debe_cambiar_password')
      .eq('id', created.user.id)
      .single();

    return json({ usuario });
  } catch (err) {
    console.error('[create-user]', err);
    return json({ error: err instanceof Error ? err.message : 'Error interno' }, 500);
  }
});
