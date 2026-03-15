import { supabase } from "../../../lib/supabase/client";

export type FamilyKnowledgeStoryTellerEntry = {
  firstName: string;
  lastName: string;
  relationshipLabel: string;
};

export type FamilyKnowledgeMemoryValues = {
  storyTellers: FamilyKnowledgeStoryTellerEntry[];
  familyAnecdote: string;

  hasSeenFamilyPhotos: "" | "yes" | "no";
  seenFamilyPhotosContext: string;

  hasFamilyPhotos: "" | "yes" | "no";
  familyPhotosNote: string;
};

type GetFamilyKnowledgeMemoryInput = {
  participantId: string;
};

export function createEmptyFamilyKnowledgeStoryTeller(): FamilyKnowledgeStoryTellerEntry {
  return {
    firstName: "",
    lastName: "",
    relationshipLabel: "",
  };
}

export function getDefaultFamilyKnowledgeMemoryValues(): FamilyKnowledgeMemoryValues {
  return {
    storyTellers: [],
    familyAnecdote: "",

    hasSeenFamilyPhotos: "",
    seenFamilyPhotosContext: "",

    hasFamilyPhotos: "",
    familyPhotosNote: "",
  };
}

function normalizeStoryTeller(input: any): FamilyKnowledgeStoryTellerEntry {
  return {
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    relationshipLabel: input?.relationshipLabel ?? "",
  };
}

export async function getFamilyKnowledgeMemory({
  participantId,
}: GetFamilyKnowledgeMemoryInput): Promise<FamilyKnowledgeMemoryValues | null> {
  const res = await supabase
    .from("participant_family_knowledge_memory")
    .select("data")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data?.data) return null;

  const raw = res.data.data;

  return {
    storyTellers: Array.isArray(raw.storyTellers)
      ? raw.storyTellers.map(normalizeStoryTeller)
      : [],
    familyAnecdote: raw.familyAnecdote ?? "",

    hasSeenFamilyPhotos:
      raw.hasSeenFamilyPhotos === "yes" || raw.hasSeenFamilyPhotos === "no"
        ? raw.hasSeenFamilyPhotos
        : "",
    seenFamilyPhotosContext: raw.seenFamilyPhotosContext ?? "",

    hasFamilyPhotos:
      raw.hasFamilyPhotos === "yes" || raw.hasFamilyPhotos === "no"
        ? raw.hasFamilyPhotos
        : "",
    familyPhotosNote: raw.familyPhotosNote ?? "",
  };
}