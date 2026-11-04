import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Verifies that the request carries a user JWT belonging to an admin.
 * Returns the caller's user id, or an error Response to send back as-is.
 *
 * Note: the public anon key is also a valid JWT, so Supabase's built-in
 * `verify_jwt` check alone is NOT enough to protect privileged functions.
 */
export async function requireAdmin(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<{ userId: string } | { error: Response }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { error: jsonResponse({ error: 'Unauthorized' }, 401) }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return { error: jsonResponse({ error: 'Unauthorized' }, 401) }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_admin) return { error: jsonResponse({ error: 'Forbidden' }, 403) }

  return { userId: user.id }
}
