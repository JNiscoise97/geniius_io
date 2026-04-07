// src/features/player/core/activity/utils/getPenaltyForAttempt.ts

import type { QuestionEvaluation } from "../activityTypes";

export function getPenaltyForAttempt(
  evaluation: Extract<QuestionEvaluation, { kind: "auto_correct" }>,
  attemptNumber: number
): number {
  if (!evaluation.penaltyEnabled) return 0;

  if (
    Array.isArray(evaluation.penaltyByAttempt) &&
    evaluation.penaltyByAttempt.length > 0
  ) {
    const index = Math.max(0, attemptNumber - 1);
    const lastKnown =
      evaluation.penaltyByAttempt[evaluation.penaltyByAttempt.length - 1] ?? 0;

    return evaluation.penaltyByAttempt[index] ?? lastKnown;
  }

  return evaluation.penalty ?? 0;
}