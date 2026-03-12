import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeAuntUnclePerson,
  FamilyKnowledgeGrandparentPerson,
  FamilyKnowledgeGrandparentsValues,
} from "./getFamilyKnowledgeGrandparents";

type SaveFamilyKnowledgeGrandparentsInput = {
  participantId: string;
  values: FamilyKnowledgeGrandparentsValues;
};

function cleanText(value: string): string {
  return value.trim();
}

function normalizeGrandparentPerson(
  person: FamilyKnowledgeGrandparentPerson,
): FamilyKnowledgeGrandparentPerson {
  return {
    known: person.known,
    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),
    isAlive: person.isAlive,
    hasPhoto: person.hasPhoto,
  };
}

function normalizeAuntUnclePerson(
  person: FamilyKnowledgeAuntUnclePerson,
): FamilyKnowledgeAuntUnclePerson {
  return {
    known: person.known,
    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),
    isAlive: person.isAlive,
    hasPhoto: person.hasPhoto,
    relationshipType: person.relationshipType,
    birthOrder: cleanText(person.birthOrder),
  };
}

export async function saveFamilyKnowledgeGrandparents({
  participantId,
  values,
}: SaveFamilyKnowledgeGrandparentsInput): Promise<void> {
  const payload = {
    paternalGrandfather: normalizeGrandparentPerson(values.paternalGrandfather),
    paternalGrandmother: normalizeGrandparentPerson(values.paternalGrandmother),
    maternalGrandfather: normalizeGrandparentPerson(values.maternalGrandfather),
    maternalGrandmother: normalizeGrandparentPerson(values.maternalGrandmother),

    paternalAuntsUncles: values.paternalAuntsUncles.map(normalizeAuntUnclePerson),
    knowsFatherSiblingOrder: values.knowsFatherSiblingOrder,

    maternalAuntsUncles: values.maternalAuntsUncles.map(normalizeAuntUnclePerson),
    knowsMotherSiblingOrder: values.knowsMotherSiblingOrder,
  };

  const res = await supabase
    .from("participant_family_knowledge_grandparents")
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