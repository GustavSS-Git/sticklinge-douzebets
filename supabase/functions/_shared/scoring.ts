// Pure scoring logic, shared by the `calculate-scores` edge function and the unit tests.
// No imports, so it runs unchanged in both Deno and Node/Vitest.

export interface Placements {
  first_place: string | null
  second_place: string | null
  third_place: string | null
  fourth_place: string | null
  fifth_place: string | null
  last_place: string | null
}

export interface PredictionInput extends Placements {
  id: string
  user_id: string
  sweden_final_position: number | null
}

export interface ActualResultsInput extends Placements {
  sweden_actual_position: number | null
}

export interface ScoredPrediction {
  id: string
  user_id: string
  points: number
  /** Distance between predicted and actual Swedish placement. Used as tiebreaker. */
  swedenDiff: number
}

/** Used when a Sweden tiebreaker can't be computed, so those entries sort last. */
export const NO_TIEBREAKER = 999

const top5 = (p: Placements) =>
  [p.first_place, p.second_place, p.third_place, p.fourth_place, p.fifth_place].filter(
    (id): id is string => Boolean(id),
  )

/**
 * Scoring rules:
 *   +1 for each predicted top-5 country that finished in the top 5 (any order)
 *   +1 bonus for the correct winner
 *   +2 for the correct last place
 */
export function scorePrediction(pred: PredictionInput, actual: ActualResultsInput): ScoredPrediction {
  const actualTop5 = top5(actual)
  let points = 0

  for (const country of top5(pred)) {
    if (actualTop5.includes(country)) points += 1
  }
  if (pred.first_place && pred.first_place === actual.first_place) points += 1
  if (pred.last_place && pred.last_place === actual.last_place) points += 2

  const swedenDiff =
    pred.sweden_final_position != null && actual.sweden_actual_position != null
      ? Math.abs(pred.sweden_final_position - actual.sweden_actual_position)
      : NO_TIEBREAKER

  return { id: pred.id, user_id: pred.user_id, points, swedenDiff }
}

/** Highest points first; ties broken by closest guess of Sweden's placement. */
export function rankScores(scores: ScoredPrediction[]): ScoredPrediction[] {
  return [...scores].sort((a, b) => b.points - a.points || a.swedenDiff - b.swedenDiff)
}
