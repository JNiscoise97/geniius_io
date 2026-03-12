import { supabase } from "../../../lib/supabase/client";
import type { FamilyKnowledgeMemoryValues } from "./getFamilyKnowledgeMemory";

type SaveFamilyKnowledgeMemoryInput = {
  participantId: string;
  values: FamilyKnowledgeMemoryValues;
};

function cleanText(value: string): string {
  return value.trim();
}

function normalizeStoryTeller(storyTeller: {
  firstName: string;
  lastName: string;
  relationshipLabel: string;
}) {
  return {
    firstName: cleanText(storyTeller.firstName),
    lastName: cleanText(storyTeller.lastName),
    relationshipLabel: cleanText(storyTeller.relationshipLabel),
  };
}

export async function saveFamilyKnowledgeMemory({
  participantId,
  values,
}: SaveFamilyKnowledgeMemoryInput): Promise<void> {
  const payload = {
    storyTellers: values.storyTellers.map(normalizeStoryTeller),
    familyAnecdote: cleanText(values.familyAnecdote),
    hasFamilyPhotos: values.hasFamilyPhotos,
    familyPhotosNote: cleanText(values.familyPhotosNote),
  };

  const res = await supabase
    .from("participant_family_knowledge_memory")
    .upsert(
      {
        participant_id: participantId,
        data: payload,
        completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "participant_id" },
    );

  if (res.error) {
    throw new Error(res.error.message);
  }
}