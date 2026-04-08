// features/family-knowledge/api/saveFamilyKnowledgeGrandparents.ts

import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeAuntUnclePerson,
  FamilyKnowledgeConfidence,
  FamilyKnowledgeGrandparentPerson,
  FamilyKnowledgeGrandparentsValues,
  FamilyKnowledgeSex,
  FamilyKnowledgeYesNo,
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

function normalizeYesNo(value: string): FamilyKnowledgeYesNo {
  return value === "yes" || value === "no" ? value : "";
}

function normalizeSex(value: string): FamilyKnowledgeSex {
  return value === "M" || value === "F" || value === "U" ? value : "";
}

function normalizeConfidence(value: string): FamilyKnowledgeConfidence {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "";
}

function normalizeGrandparentPerson(
  person: FamilyKnowledgeGrandparentPerson,
): FamilyKnowledgeGrandparentPerson {
  return {
    id: cleanText(person.id),
    known: person.known,

    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),

    sex: normalizeSex(person.sex),

    birthYear: cleanText(person.birthYear),
    deathYear: cleanText(person.deathYear),

    birthPlace: cleanText(person.birthPlace),
    currentPlace: cleanText(person.currentPlace),
    deathPlace: cleanText(person.deathPlace),

    isAlive: normalizeYesNo(person.isAlive),
    hasPhoto: normalizeYesNo(person.hasPhoto),

    confidence: normalizeConfidence(person.confidence),
    notes: cleanText(person.notes),
  };
}

function normalizeAuntUnclePerson(
  person: FamilyKnowledgeAuntUnclePerson,
): FamilyKnowledgeAuntUnclePerson {
  return {
    id: cleanText(person.id),
    known: person.known,

    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),

    sex: normalizeSex(person.sex),

    birthYear: cleanText(person.birthYear),
    deathYear: cleanText(person.deathYear),

    birthPlace: cleanText(person.birthPlace),
    currentPlace: cleanText(person.currentPlace),
    deathPlace: cleanText(person.deathPlace),

    isAlive: normalizeYesNo(person.isAlive),
    hasPhoto: normalizeYesNo(person.hasPhoto),

    confidence: normalizeConfidence(person.confidence),
    notes: cleanText(person.notes),

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

    hasPaternalAuntsUncles: normalizeYesNo(values.hasPaternalAuntsUncles),
    paternalAuntsUncles:
      values.hasPaternalAuntsUncles === "yes"
        ? normalizedPaternalAuntsUncles
        : [],
    knowsFatherSiblingOrder:
      values.hasPaternalAuntsUncles === "yes"
        ? values.knowsFatherSiblingOrder
        : false,
    paternalSiblingOrder,

    hasMaternalAuntsUncles: normalizeYesNo(values.hasMaternalAuntsUncles),
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