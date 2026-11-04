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

    // Reset all calculated points to 0
    await supabaseAdmin
      .from('predictions')
      .update({ calculated_points: 0 })
      .eq('year', 2026)
      .eq('is_submitted', true)

    // Unpublish results
    await supabaseAdmin
      .from('settings')
      .update({ results_published: false })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    return jsonResponse({ success: true })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
})
