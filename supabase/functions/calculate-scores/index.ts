import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse, requireAdmin } from '../_shared/require-admin.ts'
import { rankScores, scorePrediction } from '../_shared/scoring.ts'

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

    const body = await req.json().catch(() => ({}))
    const publish = body.publish ?? false

    const { data: results } = await supabaseAdmin
      .from('actual_results')
      .select('*')
      .eq('year', 2026)
      .single()

    if (!results) {
      return jsonResponse({ error: 'Inga faktiska resultat hittades. Fyll i dem först.' }, 400)
    }

    const { data: predictions } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('year', 2026)
      .eq('is_submitted', true)

    if (!predictions || predictions.length === 0) {
      return jsonResponse({ error: 'Inga inskickade tips hittades.' }, 400)
    }

    const scored = predictions.map((pred) => scorePrediction(pred, results))

    for (const { id, points } of scored) {
      await supabaseAdmin.from('predictions').update({ calculated_points: points }).eq('id', id)
    }

    if (publish) {
      await supabaseAdmin
        .from('settings')
        .update({ results_published: true })
        .neq('id', '00000000-0000-0000-0000-000000000000')
    }

    return jsonResponse({
      success: true,
      processed: predictions.length,
      publish,
      ranking: rankScores(scored),
    })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
})
