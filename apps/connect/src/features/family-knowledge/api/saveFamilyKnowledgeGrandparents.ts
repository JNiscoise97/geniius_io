import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeAuntUnclePerson,
  FamilyKnowledgeGrandparentPerson,
  FamilyKnowledgeGrandparentsValues,
} from "./getFamilyKnowledgeGrandparents";
import {
  FATHER_SIBLING_ORDER_KEY,
  MOTHER_SIBLING_ORDER_KEY,
} from "./getFamilyKnowledgeGrandparents";
import { normalizeOrderedKeys } from "../lib/siblingOrder";

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
    id: person.id,
    known: person.known,
    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),
    isAlive: person.isAlive,
    hasPhoto: person.hasPhoto,
    relationshipType: person.relationshipType,
  };
}

export async function saveFamilyKnowledgeGrandparents({
  participantId,
  values,
}: SaveFamilyKnowledgeGrandparentsInput): Promise<void> {
  const normalizedPaternalAuntsUncles = values.paternalAuntsUncles.map(
    normalizeAuntUnclePerson,
  );
  const normalizedMaternalAuntsUncles = values.maternalAuntsUncles.map(
    normalizeAuntUnclePerson,
  );

  const paternalAllowedKeys = normalizedPaternalAuntsUncles
    .filter((person) => person.known)
    .map((person) => `paternal:${person.id}`);

  const maternalAllowedKeys = normalizedMaternalAuntsUncles
    .filter((person) => person.known)
    .map((person) => `maternal:${person.id}`);

  const paternalSiblingOrder =
    values.hasPaternalAuntsUncles === "yes" && values.knowsFatherSiblingOrder
      ? normalizeOrderedKeys({
          existingKeys: values.paternalSiblingOrder,
          allowedKeys: [FATHER_SIBLING_ORDER_KEY, ...paternalAllowedKeys],
          fixedKey: FATHER_SIBLING_ORDER_KEY,
        })
      : [];

  const maternalSiblingOrder =
    values.hasMaternalAuntsUncles === "yes" && values.knowsMotherSiblingOrder
      ? normalizeOrderedKeys({
          existingKeys: values.maternalSiblingOrder,
          allowedKeys: [MOTHER_SIBLING_ORDER_KEY, ...maternalAllowedKeys],
          fixedKey: MOTHER_SIBLING_ORDER_KEY,
        })
      : [];

  const payload = {
    paternalGrandfather: normalizeGrandparentPerson(values.paternalGrandfather),
    paternalGrandmother: normalizeGrandparentPerson(values.paternalGrandmother),
    maternalGrandfather: normalizeGrandparentPerson(values.maternalGrandfather),
    maternalGrandmother: normalizeGrandparentPerson(values.maternalGrandmother),

    hasPaternalAuntsUncles: values.hasPaternalAuntsUncles,
    paternalAuntsUncles:
      values.hasPaternalAuntsUncles === "yes"
        ? normalizedPaternalAuntsUncles
        : [],
    knowsFatherSiblingOrder:
      values.hasPaternalAuntsUncles === "yes"
        ? values.knowsFatherSiblingOrder
        : false,
    paternalSiblingOrder,

    hasMaternalAuntsUncles: values.hasMaternalAuntsUncles,
    maternalAuntsUncles:
      values.hasMaternalAuntsUncles === "yes"
        ? normalizedMaternalAuntsUncles
        : [],
    knowsMotherSiblingOrder:
      values.hasMaternalAuntsUncles === "yes"
        ? values.knowsMotherSiblingOrder
        : false,
    maternalSiblingOrder,
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