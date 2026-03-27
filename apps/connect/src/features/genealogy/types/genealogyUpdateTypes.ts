// genealogyUpdateTypes.ts

export type GenealogyUpdateAction =
  | "add_missing_person"
  | "complete_person"
  | "correct_person";

export type MissingRelativeKind =
  | "child"
  | "sibling"
  | "partner"
  | "parent"
  | "other";

export type ExistingFieldKey =
  | "identity"
  | "dates"
  | "places"
  | "photo"
  | "relationship"
  | "other";

export type LivingStatus = "" | "yes" | "no";

export type GenealogyPrivacyFlags = {
  personIsLiving: LivingStatus;
  personIsMinor: LivingStatus;
  hasConsentToShare: boolean;
  allowDisplayToFamily: boolean;
};

export type MissingPersonProposal = {
  relativeKind: MissingRelativeKind | "";
  firstName: string;
  lastName: string;
  nickname: string;
  birthYear: string;
  note: string;
  hasPhoto: LivingStatus;
  privacy: GenealogyPrivacyFlags;
};

export type ExistingPersonProposal = {
  action: "complete_person" | "correct_person";
  fieldKey: ExistingFieldKey | "";
  proposedValue: string;
  note: string;
  privacy: GenealogyPrivacyFlags;
};