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