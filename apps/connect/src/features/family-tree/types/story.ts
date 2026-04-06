import type { PersonUiOverride } from "../data/profiles/uiOverrides";
import type { PersonSummary } from "./person";
import type { PersonVisibilityPreferenceMap } from "./visibility";

type PersonUiOverrideMap = Record<string, PersonUiOverride>;

export type RelationshipStoryStep = {
  generationNumber: number;
  totalGenerations: number;
  person: PersonSummary;
  spouse?: PersonSummary;
  nextPerson?: PersonSummary;
  childrenCount?: number;
  nextChildRank?: number;
  nextChildLabel?: string;
  intro: string;
  facts: string[];
};

export type RelationshipStory = {
  source: PersonSummary;
  target: PersonSummary;
  steps: RelationshipStoryStep[];
  summaryLine: string;
};

export type BuildRelationshipStoryOptions = {
  visibilityPreferencesByPersonId?: PersonVisibilityPreferenceMap;
  sosaReferencePersonId?: string | null;

  overridesByPersonId?: PersonUiOverrideMap;
};