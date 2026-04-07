// src/features/player/core/activity/utils/matchesQuestionCondition.ts

import type { QuestionCondition } from "../activityTypes";

function normalizeComparableValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.trim();
  }

  return value;
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

export function matchesQuestionCondition(
  value: unknown,
  condition: QuestionCondition
): boolean {
  switch (condition.op) {
    case "equals":
      return (
        normalizeComparableValue(value) ===
        normalizeComparableValue(condition.value)
      );

    case "not_equals":
      return (
        normalizeComparableValue(value) !==
        normalizeComparableValue(condition.value)
      );

    case "includes":
      if (Array.isArray(value)) {
        return value.some(
          (item) =>
            normalizeComparableValue(item) ===
            normalizeComparableValue(condition.value)
        );
      }

      if (typeof value === "string") {
        return value.includes(String(condition.value ?? ""));
      }

      return false;

    case "is_true":
      return value === true;

    case "is_false":
      return value === false;

    case "is_empty":
      return isEmptyValue(value);

    case "is_not_empty":
      return !isEmptyValue(value);

    default:
      return false;
  }
}