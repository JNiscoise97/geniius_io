import { supabase } from "../../../lib/supabase/client";
import type { FamilyKnowledgeCurrentLinksValues } from "./getFamilyKnowledgeCurrentLinks";

type SaveFamilyKnowledgeCurrentLinksInput = {
  participantId: string;
  values: FamilyKnowledgeCurrentLinksValues;
};

function cleanText(value: string): string {
  return value.trim();
}

function normalizeCurrentLink(link: {
  firstName: string;
  lastName: string;
  relationshipType: string;
  relationshipLabel: string;
  hasPhoto: "" | "yes" | "no";
}) {
  return {
    firstName: cleanText(link.firstName),
    lastName: cleanText(link.lastName),
    relationshipType: cleanText(link.relationshipType),
    relationshipLabel: cleanText(link.relationshipLabel),
    hasPhoto: link.hasPhoto,
  };
}

export async function saveFamilyKnowledgeCurrentLinks({
  participantId,
  values,
}: SaveFamilyKnowledgeCurrentLinksInput): Promise<void> {
  const payload = {
    contacts: values.contacts.map(normalizeCurrentLink),
  };

  const res = await supabase
    .from("participant_family_knowledge_current_links")
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