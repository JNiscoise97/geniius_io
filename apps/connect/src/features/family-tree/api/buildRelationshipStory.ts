// src/features/family-tree/api/buildRelationshipStory.ts

import { getPersonContext } from "../config/configGenealogy";
import {
  RELATIONSHIP_STORY_PERSON_OVERRIDES,
} from "../config/relationshipStoryConfig";
import { findRelationshipPath } from "./findRelationshipPath";
import type {
  FamilyGraphData,
  FamilyGraphFamily,
  PersonSummary,
  PersonVisibilityPreferenceMap,
} from "../types";
import {
  anonymizePerson,
  formatPersonName,
  toOrdinalFr,
} from "../lib/genealogyUi";

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
};

function getFamiliesForSpouse(graph: FamilyGraphData, personId: string) {
  const person = graph.people[personId];
  if (!person) return [];

  return person.famsIds
    .map((id) => graph.families[id])
    .filter((fam): fam is FamilyGraphFamily => Boolean(fam));
}

function getFamilyProducingChild(
  graph: FamilyGraphData,
  parentId: string,
  childId: string,
): FamilyGraphFamily | undefined {
  return getFamiliesForSpouse(graph, parentId).find((fam) =>
    fam.childIds.includes(childId),
  );
}

function getOtherSpouseId(
  family: FamilyGraphFamily,
  personId: string,
): string | undefined {
  if (family.husbandId === personId) return family.wifeId;
  if (family.wifeId === personId) return family.husbandId;
  return undefined;
}

function getPersonSummary(
  personId: string,
  options?: BuildRelationshipStoryOptions,
): PersonSummary {
  return anonymizePerson(
    getPersonContext(
      personId,
      options?.visibilityPreferencesByPersonId,
      options?.sosaReferencePersonId,
    ).person,
  );
}

function getRankLabel(
  rank: number | undefined,
  count: number | undefined,
  sex: string,
): string | undefined {
  if (!rank || !count) return undefined;

  if (count === 1) {
    return sex === "F" ? "leur fille unique" : "leur fils unique";
  }

  if (sex === "F") return `leur ${toOrdinalFr(rank, "F")} fille`;
  return `leur ${toOrdinalFr(rank, "M")} fils`;
}

function buildDefaultIntro(params: {
  person: PersonSummary;
  spouse?: PersonSummary;
  nextPerson?: PersonSummary;
  childrenCount?: number;
  nextChildRank?: number;
}) {
  const { person, spouse, nextPerson, childrenCount, nextChildRank } = params;

  const personName = formatPersonName(person);
  const spouseName = spouse ? formatPersonName(spouse) : undefined;

  if (!nextPerson) {
    return `Cette étape mène au bout du chemin familial.`;
  }

  if (spouse && childrenCount) {
    const childLabel = getRankLabel(nextChildRank, childrenCount, nextPerson.sex);

    return `${personName}${
      spouseName ? ` a construit sa famille avec ${spouseName}` : ""
    }. Ensemble, ils ont eu ${childrenCount} enfant${
      childrenCount > 1 ? "s" : ""
    }. Tu descends de ${childLabel ?? formatPersonName(nextPerson)}.`;
  }

  if (childrenCount) {
    return `${personName} a eu ${childrenCount} enfant${
      childrenCount > 1 ? "s" : ""
    }. Ta lignée continue par ${formatPersonName(nextPerson)}.`;
  }

  return `${personName} fait partie de la branche qui mène jusqu’à ${formatPersonName(
    nextPerson,
  )}.`;
}

function buildFacts(params: {
  person: PersonSummary;
  spouse?: PersonSummary;
  childrenCount?: number;
  nextChildRank?: number;
  nextPerson?: PersonSummary;
  family?: FamilyGraphFamily;
}) {
  const { person, spouse, childrenCount, nextChildRank, nextPerson } = params;
  const override = RELATIONSHIP_STORY_PERSON_OVERRIDES[person.id];

  const facts: string[] = [];

  if (person.birthPlace && person.birthYear) {
    facts.push(
      `${person.firstName} est ${
        person.sex === "F" ? "née" : "né"
      }${person.birthPlace ? ` à ${person.birthPlace}` : ""}${
        person.birthYear ? ` en ${person.birthYear}` : ""
      }.`,
    );
  } else if (person.birthYear) {
    facts.push(
      `${person.firstName} est ${
        person.sex === "F" ? "née" : "né"
      } en ${person.birthYear}.`,
    );
  }

  if (spouse) {
    const spouseName = formatPersonName(spouse);
    const unionYear = override?.unionYear;

    facts.push(
      unionYear
        ? `${person.firstName} a épousé ${spouseName} en ${unionYear}.`
        : `${person.firstName} a eu une union avec ${spouseName}.`,
    );
  }

  if (childrenCount) {
    facts.push(
      `Le couple a eu ${childrenCount} enfant${childrenCount > 1 ? "s" : ""}.`,
    );
  }

  if (nextPerson && nextChildRank) {
    const childLabel =
      override?.childLabelOverride ??
      getRankLabel(nextChildRank, childrenCount, nextPerson.sex);

    if (childLabel) {
      facts.push(
        `La branche continue par ${childLabel} : ${formatPersonName(nextPerson)}.`,
      );
    }
  }

  if (override?.facts?.length) {
    facts.push(...override.facts);
  }

  return facts;
}

export function buildRelationshipStory(
  graph: FamilyGraphData,
  sourcePersonId: string,
  targetPersonId: string,
  options?: BuildRelationshipStoryOptions,
): RelationshipStory | null {
  const path = findRelationshipPath(graph, sourcePersonId, targetPersonId);
  if (!path || path.length === 0) return null;

  const onlyPersons = path.map((n) => n.personId);
  const totalGenerations = onlyPersons.length;

  const steps: RelationshipStoryStep[] = onlyPersons.map((personId, index) => {
    const person = getPersonSummary(personId, options);
    const nextId = onlyPersons[index + 1];
    const nextPerson = nextId ? getPersonSummary(nextId, options) : undefined;

    let family: FamilyGraphFamily | undefined;
    let spouse: PersonSummary | undefined;
    let childrenCount: number | undefined;
    let nextChildRank: number | undefined;

    if (nextId) {
      family = getFamilyProducingChild(graph, personId, nextId);

      if (family) {
        const spouseId = getOtherSpouseId(family, personId);
        spouse = spouseId ? getPersonSummary(spouseId, options) : undefined;
        childrenCount = family.childIds.length;

        const idx = family.childIds.findIndex((id) => id === nextId);
        nextChildRank = idx >= 0 ? idx + 1 : undefined;
      }
    }

    const override = RELATIONSHIP_STORY_PERSON_OVERRIDES[personId];
    const intro =
      override?.intro ??
      buildDefaultIntro({
        person,
        spouse,
        nextPerson,
        childrenCount,
        nextChildRank,
      });

    const facts = buildFacts({
      person,
      spouse,
      nextPerson,
      childrenCount,
      nextChildRank,
      family,
    });

    return {
      generationNumber: index + 1,
      totalGenerations,
      person,
      spouse,
      nextPerson,
      childrenCount,
      nextChildRank,
      nextChildLabel: getRankLabel(
        nextChildRank,
        childrenCount,
        nextPerson?.sex ?? "M",
      ),
      intro,
      facts,
    };
  });

  const summaryLine = steps.map((step) => formatPersonName(step.person)).join(" → ");

  return {
    source: getPersonSummary(sourcePersonId, options),
    target: getPersonSummary(targetPersonId, options),
    steps,
    summaryLine,
  };
}