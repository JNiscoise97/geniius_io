import type { FamilyTreeAction, FamilyTreeActionType } from "../../types/actions";

export type SubmitPersonCorrectionInput = {
  eventSlug: string;
  participantId: string;
  personId: string;
  type: Extract<
    FamilyTreeActionType,
    "fix_identity" | "fix_name" | "fix_birth" | "fix_death" | "fix_place"
  >;
  note: string;
};

export type SubmitPersonCorrectionResult = {
  ok: true;
  action: FamilyTreeAction;
};

function getTitle(type: SubmitPersonCorrectionInput["type"]) {
  switch (type) {
    case "fix_identity":
      return "Correction d’identité proposée";
    case "fix_name":
      return "Correction de nom proposée";
    case "fix_birth":
      return "Correction de naissance proposée";
    case "fix_death":
      return "Correction de décès proposée";
    case "fix_place":
      return "Correction de lieu proposée";
  }
}

export async function submitPersonCorrection(
  input: SubmitPersonCorrectionInput,
): Promise<SubmitPersonCorrectionResult> {
  const action: FamilyTreeAction = {
    id: `person-correction:${input.personId}:${input.type}:${Date.now()}`,
    type: input.type,
    status: "pending",
    personId: input.personId,
    title: getTitle(input.type),
    description: input.note.trim(),
    source: "tree-contribute",
    payload: {
      eventSlug: input.eventSlug,
      participantId: input.participantId,
      note: input.note.trim(),
    },
  };

  return {
    ok: true,
    action,
  };
}