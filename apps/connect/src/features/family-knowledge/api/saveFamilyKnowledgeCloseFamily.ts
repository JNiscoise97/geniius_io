// features/family-knowledge/api/saveFamilyKnowledgeCloseFamily.ts

import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeCloseFamilyValues,
  FamilyKnowledgeConfidence,
  FamilyKnowledgePersonEntry,
  FamilyKnowledgeSex,
  FamilyKnowledgeYesNo,
} from "./getFamilyKnowledgeCloseFamily";
import { normalizeOrderedKeys } from "../lib/siblingOrder";

type SaveFamilyKnowledgeCloseFamilyInput = {
  participantId: string;
  values: FamilyKnowledgeCloseFamilyValues;
};

const SELF_SIBLING_ORDER_KEY = "self";

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

function normalizePerson(person: FamilyKnowledgePersonEntry): FamilyKnowledgePersonEntry {
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

export async function saveFamilyKnowledgeCloseFamily({
  participantId,
  values,
}: SaveFamilyKnowledgeCloseFamilyInput): Promise<void> {
  const normalizedSiblings = values.siblings.map(normalizePerson);
  const normalizedChildren = values.children.map(normalizePerson);

  const siblingKeys = normalizedSiblings
    .filter((sibling) => sibling.known)
    .map((sibling) => `sibling:${sibling.id}`);

  const siblingOrder =
    values.hasSiblings === "yes" && values.knowsSiblingOrder
      ? normalizeOrderedKeys({
          existingKeys: values.siblingOrder,
          allowedKeys: [SELF_SIBLING_ORDER_KEY, ...siblingKeys],
          fixedKey: SELF_SIBLING_ORDER_KEY,
        })
      : [];

  const payload = {
    parent1: normalizePerson(values.parent1),
    parent2: normalizePerson(values.parent2),

    hasSiblings: normalizeYesNo(values.hasSiblings),
    siblings: values.hasSiblings === "yes" ? normalizedSiblings : [],
    knowsSiblingOrder:
      values.hasSiblings === "yes" ? values.knowsSiblingOrder : false,
    siblingOrder,

    hasChildren: normalizeYesNo(values.hasChildren),
    children: values.hasChildren === "yes" ? normalizedChildren : [],

    isInRelationship: normalizeYesNo(values.isInRelationship),
    partner: normalizePerson(values.partner),
  };

  const res = await supabase
    .from("participant_family_knowledge_close_family")
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