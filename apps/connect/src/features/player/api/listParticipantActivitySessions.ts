// src/features/player/api/listParticipantActivitySessions.ts

import { supabase } from "../../../lib/supabase/client";

export type ParticipantActivitySessionSummary = {
  activitySlug: string;
  sessionId: string;
  status: "not_started" | "in_progress" | "completed";
  currentIndex: number;
  score: number;
  pendingReviewScore: number;
  startedAt: string | null;
  completedAt: string | null;
  hasStarted: boolean;
};

type ActivitySessionListRow = {
  id: string;
  activity_slug: string;
  status: "in_progress" | "completed" | "abandoned";
  current_index: number;
  score: number;
  pending_review_score: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  has_started: boolean;
};

export type ListParticipantActivitySessionsInput = {
  eventSlug: string;
  participantId: string;
};

export async function listParticipantActivitySessions({
  eventSlug,
  participantId,
}: ListParticipantActivitySessionsInput): Promise<
  ParticipantActivitySessionSummary[]
> {
  const { data, error } = await supabase
    .from("activity_sessions")
    .select(
      "id, activity_slug, status, current_index, score, pending_review_score, started_at, completed_at, created_at, has_started"
    )
    .eq("event_slug", eventSlug)
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false })
    .returns<ActivitySessionListRow[]>();

  if (error) {
    throw new Error(
      `Impossible de charger les sessions d'activité: ${error.message}`
    );
  }

  const latestByActivitySlug = new Map<string, ActivitySessionListRow>();

  for (const row of data ?? []) {
    if (!latestByActivitySlug.has(row.activity_slug)) {
      latestByActivitySlug.set(row.activity_slug, row);
    }
  }

  return Array.from(latestByActivitySlug.values()).map((row) => ({
    activitySlug: row.activity_slug,
    sessionId: row.id,
    status:
      row.status === "completed"
        ? "completed"
        : row.has_started
          ? "in_progress"
          : "not_started",
    currentIndex: row.current_index ?? 0,
    score: row.score ?? 0,
    pendingReviewScore: row.pending_review_score ?? 0,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    hasStarted: row.has_started ?? false,
  }));
}