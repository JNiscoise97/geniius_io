// src/features/family-knowledge/config/relationshipStoryConfig.ts

import { ROOT_HONORED_PERSON_ID } from "../../../config/eventInfos";

export type RelationshipStoryPersonOverride = {
  intro?: string;
  facts?: string[];
  unionYear?: string;
  childLabelOverride?: string;
};

export const RELATIONSHIP_STORY_DEFAULT_SOURCE_ID = ROOT_HONORED_PERSON_ID;


/**
 * Mets ici les enrichissements narratifs spécifiques quand tu en as.
 * Les ids ci-dessous sont des exemples : garde ceux que tu connais déjà,
 * complète les autres avec les vrais ids de Michel / Mariot / Corine.
 */
export const RELATIONSHIP_STORY_PERSON_OVERRIDES: Record<
  string,
  RelationshipStoryPersonOverride
> = {
  "7398": {
    intro:
      "Gromèr Covindou est au point de départ de cette branche familiale.",
    facts: [
      "Elle a fondé une lignée dont plusieurs branches descendent encore aujourd’hui.",
    ],
  },

  "7391": {
    intro:
      "Coundiaman appartient à la génération qui fait basculer cette histoire dans une famille nombreuse et bien identifiée.",
    unionYear: "1911",
    facts: [
      "Elle est née à Trois-Bassins en 1891.",
      "Avec Emmanuel BLUKER, elle a eu 9 enfants.",
    ],
  },

  "7351": {
    intro:
      "Te voilà au bout du chemin. Cette histoire familiale arrive jusqu’à toi.",
    facts: [
      "Tu prolonges aujourd’hui cette branche issue de Gromèr Covindou.",
    ],
  },
};