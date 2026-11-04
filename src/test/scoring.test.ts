import { describe, it, expect } from "vitest";
import {
  scorePrediction,
  rankScores,
  NO_TIEBREAKER,
  type ActualResultsInput,
  type PredictionInput,
} from "../../supabase/functions/_shared/scoring.ts";

const actual: ActualResultsInput = {
  first_place: "SE",
  second_place: "FI",
  third_place: "NO",
  fourth_place: "IT",
  fifth_place: "FR",
  last_place: "UK",
  sweden_actual_position: 1,
};

const prediction = (overrides: Partial<PredictionInput> = {}): PredictionInput => ({
  id: "p1",
  user_id: "u1",
  first_place: null,
  second_place: null,
  third_place: null,
  fourth_place: null,
  fifth_place: null,
  last_place: null,
  sweden_final_position: null,
  ...overrides,
});

describe("scorePrediction", () => {
  it("gives the maximum of 8 points for a perfect prediction", () => {
    const pred = prediction({ ...actual, sweden_final_position: 1 });
    expect(scorePrediction(pred, actual)).toMatchObject({ points: 8, swedenDiff: 0 });
  });

  it("gives 1 point per correct top-5 country regardless of order", () => {
    const pred = prediction({
      first_place: "FR",
      second_place: "IT",
      third_place: "NO",
      fourth_place: "FI",
      fifth_place: "SE",
    });
    expect(scorePrediction(pred, actual).points).toBe(5);
  });

  it("gives a 1 point bonus for the correct winner", () => {
    const pred = prediction({ first_place: "SE" });
    expect(scorePrediction(pred, actual).points).toBe(2);
  });

  it("gives 2 points for the correct last place", () => {
    const pred = prediction({ last_place: "UK" });
    expect(scorePrediction(pred, actual).points).toBe(2);
  });

  it("gives 0 points for countries outside the top 5", () => {
    const pred = prediction({ first_place: "DE", second_place: "ES", last_place: "PL" });
    expect(scorePrediction(pred, actual).points).toBe(0);
  });

  it("does not award the winner/last bonus when both sides are empty", () => {
    const empty = { ...actual, first_place: null, last_place: null };
    expect(scorePrediction(prediction(), empty).points).toBe(0);
  });

  it("computes the Sweden tiebreaker as an absolute distance", () => {
    const actualSweden5 = { ...actual, sweden_actual_position: 5 };
    expect(scorePrediction(prediction({ sweden_final_position: 2 }), actualSweden5).swedenDiff).toBe(3);
    expect(scorePrediction(prediction({ sweden_final_position: 9 }), actualSweden5).swedenDiff).toBe(4);
  });

  it("puts entries without a Sweden guess last in tiebreaks", () => {
    expect(scorePrediction(prediction(), actual).swedenDiff).toBe(NO_TIEBREAKER);
  });
});

describe("rankScores", () => {
  it("ranks by points, then by closest Sweden guess", () => {
    const ranked = rankScores([
      { id: "a", user_id: "a", points: 3, swedenDiff: 0 },
      { id: "b", user_id: "b", points: 5, swedenDiff: 4 },
      { id: "c", user_id: "c", points: 5, swedenDiff: 1 },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("does not mutate its input", () => {
    const input = [
      { id: "a", user_id: "a", points: 1, swedenDiff: 0 },
      { id: "b", user_id: "b", points: 2, swedenDiff: 0 },
    ];
    rankScores(input);
    expect(input[0].id).toBe("a");
  });
});
