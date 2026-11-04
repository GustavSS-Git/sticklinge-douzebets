import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse, requireAdmin } from '../_shared/require-admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const auth = await requireAdmin(req, supabaseAdmin)
    if ('error' in auth) return auth.error

    const { user_id } = await req.json()
    if (!user_id) return jsonResponse({ error: 'user_id required' }, 400)

    // Prevent self-deletion
    if (user_id === auth.userId) return jsonResponse({ error: 'Cannot delete yourself' }, 400)

    // Delete related data first
    await supabaseAdmin.from('predictions').delete().eq('user_id', user_id)
    await supabaseAdmin.from('favourite_votes').delete().eq('user_id', user_id)
    await supabaseAdmin.from('profiles').delete().eq('user_id', user_id)

    // Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (error) return jsonResponse({ error: error.message }, 500)

    return jsonResponse({ success: true })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
})
