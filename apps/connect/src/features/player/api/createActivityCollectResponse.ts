import { supabase } from "../../../lib/supabase/client";

export type CreateActivityCollectResponseInput = {
  eventSlug: string;
  activitySlug: string;
  sessionId: string;
  participantId: string;
  questionId: string;
  sectionId?: string | null;
  questionType: string;
  answerJson?: unknown;
  answerText?: string | null;
  photoStoragePath?: string | null;
  photoCaption?: string | null;
  photoConsentObtained?: boolean | null;
};

type ActivityCollectResponseRow = {
  id: string;
  session_id: string;
  question_id: string;
  version_number: number | null;
};

type ActivityCollectResponseVersionInsert = {
  response_id: string | null;
  session_id: string;
  event_slug: string;
  activity_slug: string;
  participant_id: string;
  question_id: string;
  section_id: string | null;
  question_type: string;
  version_number: number;
  answer_json: unknown | null;
  answer_text: string | null;
  photo_storage_path: string | null;
  photo_caption: string | null;
  photo_consent_obtained: boolean | null;
  created_by: string | null;
};

async function loadCurrentCollectResponse(
  sessionId: string,
  questionId: string,
): Promise<ActivityCollectResponseRow | null> {
  const { data, error } = await supabase
    .from("activity_collect_responses")
    .select("id, session_id, question_id, version_number")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .maybeSingle<ActivityCollectResponseRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function createActivityCollectResponse(
  input: CreateActivityCollectResponseInput,
): Promise<void> {
  const now = new Date().toISOString();

  const current = await loadCurrentCollectResponse(
    input.sessionId,
    input.questionId,
  );

  const nextVersionNumber = (current?.version_number ?? 0) + 1;

  const snapshotPayload = {
    event_slug: input.eventSlug,
    activity_slug: input.activitySlug,
    session_id: input.sessionId,
    participant_id: input.participantId,
    question_id: input.questionId,
    section_id: input.sectionId ?? null,
    question_type: input.questionType,
    answer_json: input.answerJson ?? null,
    answer_text: input.answerText ?? null,
    photo_storage_path: input.photoStoragePath ?? null,
    photo_caption: input.photoCaption ?? null,
    photo_consent_obtained: input.photoConsentObtained ?? null,
    version_number: nextVersionNumber,
    updated_at: now,
  };

  const { data: snapshot, error: snapshotError } = await supabase
    .from("activity_collect_responses")
    .upsert(snapshotPayload, {
      onConflict: "session_id,question_id",
    })
    .select("id")
    .single<{ id: string }>();

  if (snapshotError || !snapshot) {
    throw snapshotError ?? new Error("Impossible de sauvegarder la réponse collect.");
  }

  const versionPayload: ActivityCollectResponseVersionInsert = {
    response_id: snapshot.id,
    session_id: input.sessionId,
    event_slug: input.eventSlug,
    activity_slug: input.activitySlug,
    participant_id: input.participantId,
    question_id: input.questionId,
    section_id: input.sectionId ?? null,
    question_type: input.questionType,
    version_number: nextVersionNumber,
    answer_json: input.answerJson ?? null,
    answer_text: input.answerText ?? null,
    photo_storage_path: input.photoStoragePath ?? null,
    photo_caption: input.photoCaption ?? null,
    photo_consent_obtained: input.photoConsentObtained ?? null,
    created_by: input.participantId,
  };

  const { error: versionError } = await supabase
    .from("activity_collect_response_versions")
    .insert(versionPayload);

  if (versionError) {
    throw versionError;
  }
}