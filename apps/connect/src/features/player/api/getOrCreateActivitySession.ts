// src/features/player/api/getOrCreateActivitySession.ts

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

export async function getOrCreateActivitySession({
  eventSlug,
  activitySlug,
  participantId,
  mode,
  hasStarted = false,
}: GetOrCreateActivitySessionInput): Promise<ActivitySessionRow> {
  const { data: existing, error: selectError } = await supabase
    .from("activity_sessions")
    .select("*")
    .eq("event_slug", eventSlug)
    .eq("activity_slug", activitySlug)
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ActivitySessionRow>();

  if (selectError) {
    throw new Error(
      `Impossible de charger la session d'activité: ${selectError.message}`
    );
  }

  if (existing) {
    return existing;
  }

  const nowIso = new Date().toISOString();

  const { data: created, error: insertError } = await supabase
    .from("activity_sessions")
    .insert({
      event_slug: eventSlug,
      activity_slug: activitySlug,
      participant_id: participantId,
      mode,
      status: "in_progress",
      current_question_id: null,
      current_section_id: null,
      current_index: 0,
      score: 0,
      pending_review_score: 0,
      started_at: nowIso,
      has_started: hasStarted,
      last_answered_at: null,
      completed_at: null,
    })
    .select("*")
    .single<ActivitySessionRow>();

  if (insertError || !created) {
    throw new Error(
      `Impossible de créer la session d'activité: ${
        insertError?.message ?? "erreur inconnue"
      }`
    );
  }

  return created;
}