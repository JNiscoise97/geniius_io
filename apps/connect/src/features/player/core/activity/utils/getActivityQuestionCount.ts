import type { ActivityDefinition } from "../activityTypes";

export function getActivityQuestionCount(activity: ActivityDefinition): number {
  return activity.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
}