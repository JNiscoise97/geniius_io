import { supabase } from "../../../../lib/supabase/client";

export type SaveInPersonAssistInput = {
  eventSlug: string;
  helperParticipantId: string;
  targetPersonId?: string | null;
  targetParticipantId?: string | null;
  targetEmail?: string | null;
  targetBirthYear?: number | null;
  declaredPresent: boolean;
  attended2023?: boolean | null;
  attended2024?: boolean | null;
  allowNameInFamilyTree?: boolean | null;
  allowPhotoInFamilyTree?: boolean | null;
  allowInfoInFamilyTree?: boolean | null;
  photoTaken?: boolean;
  notes?: string | null;
  targetIsMinor?: boolean;
  consentCollectedFrom?: string | null;

  testimonyInterest?:
  | "very_willing"
  | "willing"
  | "maybe"
  | "reluctant"
  | "no"
  | null;
  testimonyTopics?: string | null;
};

export async function saveInPersonAssist(
  input: SaveInPersonAssistInput,
): Promise<void> {
  const { error } = await supabase
    .from("family_tree_in_person_assists")
    .insert({
      event_slug: input.eventSlug,
      helper_participant_id: input.helperParticipantId,
      target_person_id: input.targetPersonId ?? null,
      target_participant_id: input.targetParticipantId ?? null,
      target_email: input.targetEmail ?? null,
      target_birth_year: input.targetBirthYear ?? null,
      declared_present: input.declaredPresent,
      attended_2023: input.attended2023 ?? null,
      attended_2024: input.attended2024 ?? null,
      allow_name_in_family_tree: input.allowNameInFamilyTree ?? null,
      allow_photo_in_family_tree: input.allowPhotoInFamilyTree ?? null,
      allow_info_in_family_tree: input.allowInfoInFamilyTree ?? null,
      photo_taken: input.photoTaken ?? false,
      notes: input.notes?.trim() || null,
      target_is_minor: input.targetIsMinor ?? false,
      consent_collected_from: input.consentCollectedFrom?.trim() || null,
      updated_at: new Date().toISOString(),
      testimony_interest: input.testimonyInterest ?? null,
      testimony_topics: input.testimonyTopics?.trim() || null,
    });

  if (error) {
    throw error;
  }
}