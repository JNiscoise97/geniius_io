import { supabase } from "../../../lib/supabase/client";
import type { ActivityMode } from "../core/activity/activityTypes";

export type ActivitySessionRow = {
  id: string;
  event_slug: string;
  activity_slug: string;
  participant_id: string;
  mode: ActivityMode;
  status: "in_progress" | "completed" | "abandoned";
  current_question_id: string | null;
  current_section_id: string | null;
  current_index: number;
  score: number;
  pending_review_score: number;
  started_at: string | null;
  completed_at: string | null;
  last_answered_at: string | null;
  created_at: string;
  updated_at: string;
  has_started: boolean;
};

export type GetOrCreateActivitySessionInput = {
  eventSlug: string;
  activitySlug: string;
  participantId: string;
  mode: ActivityMode;
  hasStarted?: boolean;
};

async function loadExistingActivitySession(
  eventSlug: string,
  activitySlug: string,
  participantId: string
): Promise<ActivitySessionRow | null> {
  const { data, error } = await supabase
    .from("activity_sessions")
    .select("*")
    .eq("event_slug", eventSlug)
    .eq("activity_slug", activitySlug)
    .eq("participant_id", participantId)
    .maybeSingle<ActivitySessionRow>();

  if (error) {
    throw new Error(
      `Impossible de charger la session d'activité : ${error.message}`
    );
  }

  return data;
}

export async function getOrCreateActivitySession({
  eventSlug,
  activitySlug,
  participantId,
  mode,
  hasStarted = false,
}: GetOrCreateActivitySessionInput): Promise<ActivitySessionRow> {
  const existing = await loadExistingActivitySession(
    eventSlug,
    activitySlug,
    participantId
  );

  if (existing) {
    return existing;
  }

  const nowIso = new Date().toISOString();

  const insertPayload = {
    event_slug: eventSlug,
    activity_slug: activitySlug,
    participant_id: participantId,
    mode,
    status: "in_progress" as const,
    current_question_id: null,
    current_section_id: null,
    current_index: 0,
    score: 0,
    pending_review_score: 0,
    started_at: hasStarted ? nowIso : null,
    has_started: hasStarted,
    last_answered_at: null,
    completed_at: null,
  };

  const { data: created, error: insertError } = await supabase
    .from("activity_sessions")
    .insert(insertPayload)
    .select("*")
    .single<ActivitySessionRow>();

  if (!insertError && created) {
    return created;
  }

  // Très important :
  // en cas de course concurrente, on recharge systématiquement.
  const concurrent = await loadExistingActivitySession(
    eventSlug,
    activitySlug,
    participantId
  );

  if (concurrent) {
    return concurrent;
  }

  throw new Error(
    `Impossible de créer la session d'activité : ${
      insertError?.message ?? "erreur inconnue"
    }`
  );
}