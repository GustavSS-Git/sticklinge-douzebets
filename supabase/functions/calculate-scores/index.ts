import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get actual results
    const { data: results } = await supabaseAdmin
      .from('actual_results')
      .select('*')
      .eq('year', 2026)
      .single()

    if (!results) {
      return new Response(JSON.stringify({ error: 'Inga faktiska resultat hittades. Fyll i dem först.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all submitted predictions
    const { data: predictions } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('year', 2026)
      .eq('is_submitted', true)

    if (!predictions || predictions.length === 0) {
      return new Response(JSON.stringify({ error: 'Inga inskickade tips hittades.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const actualTop5 = [
      results.first_place,
      results.second_place,
      results.third_place,
      results.fourth_place,
      results.fifth_place,
    ].filter(Boolean)

    const actualWinner = results.first_place
    const actualLast = results.last_place

    for (const pred of predictions) {
      let points = 0

      const predTop5 = [
        pred.first_place,
        pred.second_place,
        pred.third_place,
        pred.fourth_place,
        pred.fifth_place,
      ].filter(Boolean)

      // +1 for each correct country in top 5 (order doesn't matter)
      for (const country of predTop5) {
        if (actualTop5.includes(country)) points += 1
      }

      // +1 bonus for correct winner
      if (pred.first_place === actualWinner) points += 1

      // +2 for correct last place
      if (pred.last_place === actualLast) points += 2

      await supabaseAdmin
        .from('predictions')
        .update({ calculated_points: points })
        .eq('id', pred.id)
    }

    // Mark results as published
    await supabaseAdmin
      .from('settings')
      .update({ results_published: true })
      .neq('id', '00000000-0000-0000-0000-000000000000') // update all rows

    return new Response(JSON.stringify({ success: true, processed: predictions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
