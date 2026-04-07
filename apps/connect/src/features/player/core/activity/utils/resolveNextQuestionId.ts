// src/features/player/core/activity/utils/resolveNextQuestionId.ts

import type { ActivityQuestionDefinition } from "../activityTypes";
import { matchesQuestionCondition } from "./matchesQuestionCondition";

export function resolveNextQuestionId(
  question: ActivityQuestionDefinition,
  answer: unknown
): string | undefined {
  const navigation = question.navigation;

  if (!navigation) {
    return undefined;
  }

  if (navigation.branches?.length) {
    const matchedBranch = navigation.branches.find((branch) =>
      matchesQuestionCondition(answer, branch.when)
    );

    if (matchedBranch?.goto) {
      return matchedBranch.goto;
    }
  }

  return navigation.next;
}