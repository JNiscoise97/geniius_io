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