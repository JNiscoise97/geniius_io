import type { ActivityQuestionDefinition } from "../activityTypes";
import type { LearnQuestionResult } from "../../../experiences/learn/hooks/useLearnActivityPlayer";

export type QuestionSummaryStatus =
  | "correct"
  | "correct_after_retry"
  | "incorrect"
  | "skipped"
  | "info"
  | "submitted"
  | "pending";

export type GetQuestionStatusInput = {
  question: ActivityQuestionDefinition;
  result?: LearnQuestionResult | null;
  attemptsUsed?: number;
};

export function getQuestionStatus({
  question,
  result,
  attemptsUsed = 0,
}: GetQuestionStatusInput): QuestionSummaryStatus {
  if (question.type === "info") {
    return "info";
  }

  if (result?.isSkipped === true) {
    return "skipped";
  }

  if (result?.isManualReview === true) {
    return "pending";
  }

  if (result?.isCorrect === true) {
    return attemptsUsed > 1 ? "correct_after_retry" : "correct";
  }

  if (result?.isCorrect === false) {
    return "incorrect";
  }

  return "submitted";
}