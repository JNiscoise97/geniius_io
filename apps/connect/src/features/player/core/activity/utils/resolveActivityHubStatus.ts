// src/features/player/core/activity/utils/resolveActivityHubStatus.ts

import type { ActivityDefinition } from "../activityTypes";

export type ActivitySessionHubSummary = {
  activitySlug: string;
  sessionId: string;
  status: "not_started" | "in_progress" | "completed";
  currentIndex: number;
  score: number;
  pendingReviewScore: number;
  startedAt: string | null;
  completedAt: string | null;
};

export type ActivityHubStatus =
  | "available"
  | "in_progress"
  | "completed"
  | "scheduled";

type ActivityAvailability =
  | { kind: "available" }
  | { kind: "scheduled"; opensAt: string; label?: string }
  | { kind: "hidden" };

function isScheduledAvailability(
  value: unknown
): value is Extract<ActivityAvailability, { kind: "scheduled" }> {
  return (
    !!value &&
    typeof value === "object" &&
    "kind" in value &&
    (value as { kind?: string }).kind === "scheduled" &&
    "opensAt" in value
  );
}

export function resolveActivityHubStatus(
  activity: ActivityDefinition,
  session?: ActivitySessionHubSummary
): ActivityHubStatus {
  const availability = activity.availability as ActivityAvailability | undefined;

  if (isScheduledAvailability(availability)) {
    const opensAtMs = new Date(availability.opensAt).getTime();

    if (Number.isFinite(opensAtMs) && opensAtMs > Date.now()) {
      return "scheduled";
    }
  }

  if (session?.status === "completed" || session?.completedAt) {
    return "completed";
  }

  if (session?.status === "in_progress" || session?.startedAt) {
    return "in_progress";
  }

  return "available";
}

export function getActivityQuestionCount(activity: ActivityDefinition): number {
  return activity.sections.reduce(
    (total, section) => total + section.questions.length,
    0
  );
}

export function getActivityProgressPercent(
  currentIndex: number,
  totalQuestions: number,
  status: ActivityHubStatus
): number {
  if (totalQuestions <= 0) return 0;
  if (status === "completed") return 100;
  return Math.max(
    0,
    Math.min(100, Math.round((currentIndex / totalQuestions) * 100))
  );
}