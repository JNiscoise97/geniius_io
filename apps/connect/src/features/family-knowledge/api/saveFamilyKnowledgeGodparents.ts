import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeGodparentPerson,
  FamilyKnowledgeGodparentsValues,
  FamilyKnowledgeParentGodparentPerson,
} from "./getFamilyKnowledgeGodparents";

type SaveFamilyKnowledgeGodparentsInput = {
  participantId: string;
  values: FamilyKnowledgeGodparentsValues;
};

function cleanText(value: string): string {
  return value.trim();
}

function normalizeGodparentPerson(
  person: FamilyKnowledgeGodparentPerson,
): FamilyKnowledgeGodparentPerson {
  return {
    known: person.known,
    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),
    isAlive: person.isAlive,
    hasPhoto: person.hasPhoto,
    isFamilyMember: person.isFamilyMember,
  };
}

function normalizeParentGodparentPerson(
  person: FamilyKnowledgeParentGodparentPerson,
): FamilyKnowledgeParentGodparentPerson {
  return {
    known: person.known,
    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),
    hasPhoto: person.hasPhoto,
  };
}

export async function saveFamilyKnowledgeGodparents({
  participantId,
  values,
}: SaveFamilyKnowledgeGodparentsInput): Promise<void> {
  const payload = {
    personalGodparents: values.personalGodparents.map(normalizeGodparentPerson),
    fatherGodfather: normalizeParentGodparentPerson(values.fatherGodfather),
    fatherGodmother: normalizeParentGodparentPerson(values.fatherGodmother),
    motherGodfather: normalizeParentGodparentPerson(values.motherGodfather),
    motherGodmother: normalizeParentGodparentPerson(values.motherGodmother),
  };

  const res = await supabase
    .from("participant_family_knowledge_godparents")
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