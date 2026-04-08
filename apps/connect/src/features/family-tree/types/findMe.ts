import type { PersonContext, PersonSummary } from "./person";

export type FindMeAnswers = {
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  birthPlace?: string;
  fatherQuery?: string;
  motherQuery?: string;
  grandparentQuery1?: string;
  grandparentQuery2?: string;
  grandparentQuery3?: string;
  grandparentQuery4?: string;
};

export type FindMeCandidateReason = {
  label: string;
  matched: boolean;
  weight: number;
};

export type FindMeCandidate = {
  person: PersonSummary;
  context: PersonContext;
  score: number;
  confidenceLabel: "très fort" | "fort" | "moyen" | "faible";
  reasons: FindMeCandidateReason[];
};