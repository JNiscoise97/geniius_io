import { supabase } from "../../../lib/supabase/client";
import type { FamilyKnowledgeCloseFamilyValues } from "./getFamilyKnowledgeCloseFamily";

type SaveFamilyKnowledgeCloseFamilyInput = {
  participantId: string;
  values: FamilyKnowledgeCloseFamilyValues;
};

function cleanText(value: string): string {
  return value.trim();
}

function normalizePerson(person: {
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
  birthOrder: string;
}) {
  return {
    known: person.known,
    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),
    isAlive: person.isAlive,
    hasPhoto: person.hasPhoto,
    birthOrder: cleanText(person.birthOrder),
  };
}

export async function saveFamilyKnowledgeCloseFamily({
  participantId,
  values,
}: SaveFamilyKnowledgeCloseFamilyInput): Promise<void> {
  const payload = {
  parent1: normalizePerson(values.parent1),
  parent2: normalizePerson(values.parent2),

  hasSiblings: values.hasSiblings,
  siblings:
    values.hasSiblings === "yes"
      ? values.siblings.map(normalizePerson)
      : [],
  knowsSiblingOrder:
    values.hasSiblings === "yes" ? values.knowsSiblingOrder : false,

  hasChildren: values.hasChildren,
  children:
    values.hasChildren === "yes"
      ? values.children.map(normalizePerson)
      : [],

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