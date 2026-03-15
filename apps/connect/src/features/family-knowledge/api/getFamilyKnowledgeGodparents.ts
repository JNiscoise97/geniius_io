import { supabase } from "../../../lib/supabase/client";
import { createFamilyOrderId } from "../lib/siblingOrder";

export type YesNo = "" | "yes" | "no";

export type FamilyKnowledgeGodparentLinkPerson = {
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
  isFamilyMember: "" | "yes" | "no";
  familyRelationshipDetail: string;
};

export type FamilyKnowledgeGodchildPerson = {
  id: string;
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
  isFamilyMember: "" | "yes" | "no";
  familyRelationshipDetail: string;
};

export type FamilyKnowledgeParrainageSection = {
  isBaptized: YesNo;
  godfather: FamilyKnowledgeGodparentLinkPerson;
  godmother: FamilyKnowledgeGodparentLinkPerson;
  hasGodchildren: YesNo;
  godchildren: FamilyKnowledgeGodchildPerson[];
};

export type FamilyKnowledgeGodparentsValues = {
  self: FamilyKnowledgeParrainageSection;
  father: FamilyKnowledgeParrainageSection;
  mother: FamilyKnowledgeParrainageSection;
  paternalGrandfather: FamilyKnowledgeParrainageSection;
  paternalGrandmother: FamilyKnowledgeParrainageSection;
  maternalGrandfather: FamilyKnowledgeParrainageSection;
  maternalGrandmother: FamilyKnowledgeParrainageSection;
};

type GetFamilyKnowledgeGodparentsInput = {
  participantId: string;
};

function normalizeYesNo(value: unknown): YesNo {
  return value === "yes" || value === "no" ? value : "";
}

export function createEmptyFamilyKnowledgeGodparentLinkPerson(
  known = true,
): FamilyKnowledgeGodparentLinkPerson {
  return {
    known,
    firstName: "",
    lastName: "",
    nickname: "",
    isAlive: "",
    hasPhoto: "",
    isFamilyMember: "",
    familyRelationshipDetail: "",
  };
}

export function createEmptyFamilyKnowledgeGodchildPerson(
  known = true,
): FamilyKnowledgeGodchildPerson {
  return {
    id: crypto.randomUUID(),
    known,
    firstName: "",
    lastName: "",
    nickname: "",
    isAlive: "",
    hasPhoto: "",
    isFamilyMember: "",
    familyRelationshipDetail: "",
  };
}

export function createEmptyFamilyKnowledgeParrainageSection(): FamilyKnowledgeParrainageSection {
  return {
    isBaptized: "",
    godfather: createEmptyFamilyKnowledgeGodparentLinkPerson(true),
    godmother: createEmptyFamilyKnowledgeGodparentLinkPerson(true),
    hasGodchildren: "",
    godchildren: [],
  };
}

export function getDefaultFamilyKnowledgeGodparentsValues(): FamilyKnowledgeGodparentsValues {
  return {
    self: createEmptyFamilyKnowledgeParrainageSection(),
    father: createEmptyFamilyKnowledgeParrainageSection(),
    mother: createEmptyFamilyKnowledgeParrainageSection(),
    paternalGrandfather: createEmptyFamilyKnowledgeParrainageSection(),
    paternalGrandmother: createEmptyFamilyKnowledgeParrainageSection(),
    maternalGrandfather: createEmptyFamilyKnowledgeParrainageSection(),
    maternalGrandmother: createEmptyFamilyKnowledgeParrainageSection(),
  };
}

function normalizeGodparentLinkPerson(input: any): FamilyKnowledgeGodparentLinkPerson {
  return {
    known: Boolean(input?.known),
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    nickname: input?.nickname ?? "",
    isAlive: normalizeYesNo(input?.isAlive),
    hasPhoto: normalizeYesNo(input?.hasPhoto),
    isFamilyMember: normalizeYesNo(input?.isFamilyMember),
    familyRelationshipDetail: input?.familyRelationshipDetail ?? "",
  };
}

function normalizeGodchildPerson(input: any): FamilyKnowledgeGodchildPerson {
  return {
    id: input?.id ?? createFamilyOrderId(),
    known: Boolean(input?.known),
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    nickname: input?.nickname ?? "",
    isAlive: normalizeYesNo(input?.isAlive),
    hasPhoto: normalizeYesNo(input?.hasPhoto),
    isFamilyMember: normalizeYesNo(input?.isFamilyMember),
    familyRelationshipDetail: input?.familyRelationshipDetail ?? "",
  };
}

function normalizeParrainageSection(input: any): FamilyKnowledgeParrainageSection {
  return {
    isBaptized: normalizeYesNo(input?.isBaptized),
    godfather: normalizeGodparentLinkPerson(input?.godfather),
    godmother: normalizeGodparentLinkPerson(input?.godmother),
    hasGodchildren: normalizeYesNo(input?.hasGodchildren),
    godchildren: Array.isArray(input?.godchildren)
      ? input.godchildren.map(normalizeGodchildPerson)
      : [],
  };
}

export async function getFamilyKnowledgeGodparents({
  participantId,
}: GetFamilyKnowledgeGodparentsInput): Promise<FamilyKnowledgeGodparentsValues | null> {
  const res = await supabase
    .from("participant_family_knowledge_godparents")
    .select("data")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data?.data) {
    return null;
  }

  const raw = res.data.data;
  const defaults = getDefaultFamilyKnowledgeGodparentsValues();

  return {
    ...defaults,
    self: normalizeParrainageSection(raw.self),
    father: normalizeParrainageSection(raw.father),
    mother: normalizeParrainageSection(raw.mother),
    paternalGrandfather: normalizeParrainageSection(raw.paternalGrandfather),
    paternalGrandmother: normalizeParrainageSection(raw.paternalGrandmother),
    maternalGrandfather: normalizeParrainageSection(raw.maternalGrandfather),
    maternalGrandmother: normalizeParrainageSection(raw.maternalGrandmother),
  };
}