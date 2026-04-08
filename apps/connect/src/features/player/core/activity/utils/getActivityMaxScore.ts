import type { ActivityDefinition } from "../activityTypes";

export function getActivityMaxScore(activity: ActivityDefinition): number {
  return activity.sections.reduce((total, section) => {
    return (
      total +
      section.questions.reduce((sectionTotal, question) => {
        const evaluation = question.evaluation;

        if (
          evaluation.kind === "auto_correct" ||
          evaluation.kind === "submit_only" ||
          evaluation.kind === "manual_review"
        ) {
          if (question.type === "photo" && question.tier?.options?.length) {
            return (
              sectionTotal +
              Math.max(...question.tier.options.map((option) => option.points))
            );
          }

          return sectionTotal + (evaluation.points ?? 0);
        }

        return sectionTotal;
      }, 0)
    );
  }, 0);
}