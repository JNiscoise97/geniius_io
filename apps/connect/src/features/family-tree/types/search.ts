import type { PersonSummary } from "./person";

export type FamilySearchDocument = {
  id: string;
  personId: string;

  firstName: string;
  lastName: string;
  nickname?: string;

  firstNameNormalized: string;
  lastNameNormalized: string;
  nicknameNormalized?: string;
  fullNameNormalized: string;

  birthYear?: string;
  deathYear?: string;
  currentPlace?: string;
  birthPlace?: string;
  deathPlace?: string;

  birthPlaceNormalized?: string;
  deathPlaceNormalized?: string;

  branch?: string[];
  canDisplay: boolean;
  canDisplayName: boolean;
  canDisplayPhoto: boolean;
  canDisplayInfo: boolean;
  isPossiblyAlive?: boolean;

  searchableText: string;
  tokens: string[];
};

export type PersonSearchMatchKey =
  | "full_name_exact"
  | "first_name_exact"
  | "last_name_exact"
  | "nickname_exact"
  | "first_name_prefix"
  | "last_name_prefix"
  | "nickname_partial"
  | "birth_place"
  | "death_place"
  | "birth_year"
  | "death_year"
  | "token_partial"
  | "relationship_bonus"
  | "visibility_bonus";

export type PersonSearchResult = {
  personId: string;
  score: number;
  matchedOn: PersonSearchMatchKey[];
};

export type EnrichedPersonSearchResult = {
  person: PersonSummary;
  score: number;
  matchedOn: PersonSearchMatchKey[];
  relationshipSummary?: string;
};