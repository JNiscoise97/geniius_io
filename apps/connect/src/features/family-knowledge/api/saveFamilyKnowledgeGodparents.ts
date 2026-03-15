import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeGodchildPerson,
  FamilyKnowledgeGodparentLinkPerson,
  FamilyKnowledgeGodparentsValues,
  FamilyKnowledgeParrainageSection,
} from "./getFamilyKnowledgeGodparents";

type SaveFamilyKnowledgeGodparentsInput = {
  participantId: string;
  values: FamilyKnowledgeGodparentsValues;
};

function cleanText(value: string): string {
  return value.trim();
}

function normalizeGodparentLinkPerson(
  person: FamilyKnowledgeGodparentLinkPerson,
): FamilyKnowledgeGodparentLinkPerson {
  return {
    known: person.known,
    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),
    isAlive: person.isAlive,
    hasPhoto: person.hasPhoto,
    isFamilyMember: person.isFamilyMember,
    familyRelationshipDetail:
      person.isFamilyMember === "yes"
        ? cleanText(person.familyRelationshipDetail)
        : "",
  };
}

function normalizeGodchildPerson(
  person: FamilyKnowledgeGodchildPerson,
): FamilyKnowledgeGodchildPerson {
  return {
    id: person.id,
    known: person.known,
    firstName: cleanText(person.firstName),
    lastName: cleanText(person.lastName),
    nickname: cleanText(person.nickname),
    isAlive: person.isAlive,
    hasPhoto: person.hasPhoto,
    isFamilyMember: person.isFamilyMember,
    familyRelationshipDetail:
      person.isFamilyMember === "yes"
        ? cleanText(person.familyRelationshipDetail)
        : "",
  };
}

function normalizeParrainageSection(
  section: FamilyKnowledgeParrainageSection,
): FamilyKnowledgeParrainageSection {
  return {
    isBaptized: section.isBaptized,
    godfather:
      section.isBaptized === "yes"
        ? normalizeGodparentLinkPerson(section.godfather)
        : normalizeGodparentLinkPerson({
            known: false,
            firstName: "",
            lastName: "",
            nickname: "",
            isAlive: "",
            hasPhoto: "",
            isFamilyMember: "",
            familyRelationshipDetail: "",
          }),
    godmother:
      section.isBaptized === "yes"
        ? normalizeGodparentLinkPerson(section.godmother)
        : normalizeGodparentLinkPerson({
            known: false,
            firstName: "",
            lastName: "",
            nickname: "",
            isAlive: "",
            hasPhoto: "",
            isFamilyMember: "",
            familyRelationshipDetail: "",
          }),
    hasGodchildren: section.hasGodchildren,
    godchildren:
      section.hasGodchildren === "yes"
        ? section.godchildren.map(normalizeGodchildPerson)
        : [],
  };
}

export async function saveFamilyKnowledgeGodparents({
  participantId,
  values,
}: SaveFamilyKnowledgeGodparentsInput): Promise<void> {
  const payload = {
    self: normalizeParrainageSection(values.self),
    father: normalizeParrainageSection(values.father),
    mother: normalizeParrainageSection(values.mother),
    paternalGrandfather: normalizeParrainageSection(values.paternalGrandfather),
    paternalGrandmother: normalizeParrainageSection(values.paternalGrandmother),
    maternalGrandfather: normalizeParrainageSection(values.maternalGrandfather),
    maternalGrandmother: normalizeParrainageSection(values.maternalGrandmother),
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