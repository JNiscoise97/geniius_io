import { supabase } from "../../../lib/supabase/client";
import type { RelationshipTypeValue } from "../components/RelationshipTypeField";

export type FamilyKnowledgeCurrentLinkEntry = {
  firstName: string;
  lastName: string;
  relationshipType: RelationshipTypeValue;
  relationshipLabel: string;
  hasPhoto: "" | "yes" | "no";
};

export type FamilyKnowledgeCurrentLinksValues = {
  contacts: FamilyKnowledgeCurrentLinkEntry[];
};

type GetFamilyKnowledgeCurrentLinksInput = {
  participantId: string;
};

export function createEmptyFamilyKnowledgeCurrentLink(): FamilyKnowledgeCurrentLinkEntry {
  return {
    firstName: "",
    lastName: "",
    relationshipType: "",
    relationshipLabel: "",
    hasPhoto: "",
  };
}

export function getDefaultFamilyKnowledgeCurrentLinksValues(): FamilyKnowledgeCurrentLinksValues {
  return {
    contacts: [],
  };
}

function normalizeCurrentLink(input: any): FamilyKnowledgeCurrentLinkEntry {
  return {
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    relationshipType: input?.relationshipType ?? "",
    relationshipLabel: input?.relationshipLabel ?? "",
    hasPhoto:
      input?.hasPhoto === "yes" || input?.hasPhoto === "no" ? input.hasPhoto : "",
  };
}

export async function getFamilyKnowledgeCurrentLinks({
  participantId,
}: GetFamilyKnowledgeCurrentLinksInput): Promise<FamilyKnowledgeCurrentLinksValues | null> {
  const res = await supabase
    .from("participant_family_knowledge_current_links")
    .select("data")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data?.data) return null;

  const raw = res.data.data;

  return {
    contacts: Array.isArray(raw.contacts)
      ? raw.contacts.map(normalizeCurrentLink)
      : [],
  };
}