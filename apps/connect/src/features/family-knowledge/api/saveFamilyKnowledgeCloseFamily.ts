import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeCloseFamilyValues,
  FamilyKnowledgePersonEntry,
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

function normalizePerson(person: FamilyKnowledgePersonEntry): FamilyKnowledgePersonEntry {
  return {
    id: person.id,
    known: person.known,
    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),
    isAlive: person.isAlive,
    hasPhoto: person.hasPhoto,
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

    hasSiblings: values.hasSiblings,
    siblings: values.hasSiblings === "yes" ? normalizedSiblings : [],
    knowsSiblingOrder:
      values.hasSiblings === "yes" ? values.knowsSiblingOrder : false,
    siblingOrder,

    hasChildren: values.hasChildren,
    children: values.hasChildren === "yes" ? normalizedChildren : [],

    isInRelationship: values.isInRelationship,
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