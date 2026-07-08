// Edge Function: delete-user
// Elimina definitivamente un usuario (admin API, requiere service role).
// Autorización: owner elimina members de SU taller; master elimina
// owners/members de cualquier taller. Nadie se elimina a sí mismo ni a un master.
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
    if (perfil.rol !== 'master' && perfil.rol !== 'owner') {
      return json({ error: 'Sin permisos para eliminar usuarios' }, 403);
    }

    // 2. Usuario a eliminar
    const body = await req.json();
    const targetId = body.user_id as string | undefined;
    if (!targetId) {
      return json({ error: 'user_id es requerido' }, 400);
    }
    if (targetId === caller.id) {
      return json({ error: 'No podés eliminarte a vos mismo' }, 400);
    }

    const { data: target } = await admin
      .from('usuarios')
      .select('id, rol, tenant_id')
      .eq('id', targetId)
      .single();

    if (!target) {
      return json({ error: 'Usuario no encontrado' }, 404);
    }
    if (target.rol === 'master') {
      return json({ error: 'No se puede eliminar a un master admin' }, 403);
    }
    if (perfil.rol === 'owner' && (target.rol !== 'member' || target.tenant_id !== perfil.tenant_id)) {
      return json({ error: 'Solo podés eliminar members de tu propio taller' }, 403);
    }

    // 3. Eliminar del admin API — el ON DELETE CASCADE en usuarios/permisos_modulo
    // se dispara solo. Si el usuario ya tiene actividad (órdenes, dispositivos,
    // transacciones registradas a su nombre), la base rechaza el borrado por
    // integridad referencial: se lo traduce a un mensaje entendible.
    const { error: deleteError } = await admin.auth.admin.deleteUser(targetId);
    if (deleteError) {
      const raw = deleteError.message || '';
      if (/foreign key|violat/i.test(raw)) {
        return json({
          error: 'Este usuario ya tiene actividad registrada (órdenes, dispositivos o movimientos de caja) y no se puede eliminar sin perder ese historial. Desactivalo en su lugar.',
        }, 409);
      }
      console.error('[delete-user] admin.deleteUser:', JSON.stringify(deleteError));
      return json({ error: raw || 'Error al eliminar el usuario' }, 400);
    }

    return json({ status: 'success' });
  } catch (err) {
    console.error('[delete-user]', err);
    return json({ error: err instanceof Error ? err.message : 'Error interno' }, 500);
  }
});
