export type GedcomSex = "M" | "F" | "U";

export type FamilyGraphPerson = {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  sex: GedcomSex;
  birthDate?: string;
  deathDate?: string;
  birthYear?: string;
  deathYear?: string;
  birthPlace?: string;
  currentPlace?: string;
  deathPlace?: string;
  famcIds: string[]; // familles où la personne est enfant
  famsIds: string[]; // familles où la personne est conjoint
  branch?: string[];
};

export type FamilyGraphFamily = {
  id: string;
  husbandId?: string;
  wifeId?: string;
  childIds: string[];
};

export type FamilyGraphData = {
  people: Record<string, FamilyGraphPerson>;
  families: Record<string, FamilyGraphFamily>;
};

export type PersonSummary = {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  sex: string;
  subtitle: string;
  birthYear?: string;
  deathYear?: string;
  birthPlace?: string;
  currentPlace?: string;
  deathPlace?: string;
  photoSrc?: string;
  spouseRoleLabel?: string;
  linkedSpouseLabel?: string;
  isPossiblyAlive?: boolean;
  isSosa: boolean;
  canDisplay: boolean;
  canDisplayName: boolean;
  canDisplayPhoto: boolean;
  canDisplayInfo: boolean;
  branch?: string[];
};

export type PersonContext = {
  person: PersonSummary;
  parents: PersonSummary[];
  spouses: PersonSummary[];
  children: PersonSummary[];
  siblings: PersonSummary[];
  grandparents: PersonSummary[];
};


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

export type ParticipantTreeVisibilityPreferences = {
  allowNameInFamilyTree?: boolean | null;
  allowPhotoInFamilyTree?: boolean | null;
  allowInfoInFamilyTree?: boolean | null;
};

export type ParticipantVisibilityPreferenceMap = Record<
  string,
  ParticipantTreeVisibilityPreferences | undefined
>;

export type PersonVisibilityPreferenceMap = Record<
  string,
  ParticipantTreeVisibilityPreferences | undefined
>;