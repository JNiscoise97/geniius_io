import { PERSON_UI_OVERRIDES } from "./uiOverrides";
import type {
  FamilyGraphData,
  FamilyGraphFamily,
  FamilyGraphPerson,
  PersonContext,
  PersonSummary,
} from "../types";

function defaultSubtitleForSex(sex: FamilyGraphPerson["sex"]): string {
  if (sex === "F") return "Aïeule";
  if (sex === "M") return "Aïeul";
  return "Personne";
}

function getParentSubtitle(sex?: FamilyGraphPerson["sex"]): string {
  if (sex === "F") return "Mère";
  if (sex === "M") return "Père";
  return "Parent";
}

function getChildSubtitle(sex?: FamilyGraphPerson["sex"]): string {
  if (sex === "F") return "Fille";
  if (sex === "M") return "Fils";
  return "Enfant";
}

function getSpouseSubtitle(sex?: FamilyGraphPerson["sex"]): string {
  if (sex === "F") return "Conjointe";
  if (sex === "M") return "Conjoint";
  return "Conjoint";
}

function getGrandparentSubtitle(sex?: FamilyGraphPerson["sex"]): string {
  if (sex === "F") return "Grand-mère";
  if (sex === "M") return "Grand-père";
  return "Grand-parent";
}

function getSiblingSubtitleFromSharedParents(
  siblingSex: FamilyGraphPerson["sex"] | undefined,
  siblingParentIds: string[],
  personParentIds: Set<string>,
  graph: FamilyGraphData,
): string {
  const sharedParentIds = siblingParentIds.filter((id) =>
    personParentIds.has(id),
  );

  if (sharedParentIds.length >= 2) {
    if (siblingSex === "F") return "Sœur";
    if (siblingSex === "M") return "Frère";
    return "Frère / sœur";
  }

  if (sharedParentIds.length === 1) {
    const sharedParent = graph.people[sharedParentIds[0]];
    const sharedParentSex = sharedParent?.sex;

    const personKnownParentsCount = personParentIds.size;
    const siblingKnownParentsCount = siblingParentIds.length;

    const lowConfidenceContext =
      personKnownParentsCount <= 1 && siblingKnownParentsCount <= 1;

    if (lowConfidenceContext) {
      if (siblingSex === "F") return "Sœur";
      if (siblingSex === "M") return "Frère";
      return "Frère / sœur";
    }

    if (sharedParentSex === "M") {
      if (siblingSex === "F") return "Sœur par le père";
      if (siblingSex === "M") return "Frère par le père";
      return "Frère / sœur par le père";
    }

    if (sharedParentSex === "F") {
      if (siblingSex === "F") return "Sœur par la mère";
      if (siblingSex === "M") return "Frère par la mère";
      return "Frère / sœur par la mère";
    }
  }

  if (siblingSex === "F") return "Sœur";
  if (siblingSex === "M") return "Frère";
  return "Frère / sœur";
}

function formatLinkedSpouseLabel(spouse?: PersonSummary): string | undefined {
  if (!spouse) return undefined;
  const name = `${spouse.firstName} ${spouse.lastName}`.trim();
  return name ? `Avec ${name}` : undefined;
}

function uniqueById(
  items: Array<PersonSummary | null | undefined>,
): PersonSummary[] {
  const map = new Map<string, PersonSummary>();
  for (const item of items) {
    if (!item) continue;
    map.set(item.id, item);
  }
  return [...map.values()];
}

function computeIsPossiblyAlive(
  person: FamilyGraphPerson | undefined,
): boolean | undefined {
  if (!person) return undefined;

  if (person.deathYear) return false;
  if (!person.birthYear) return undefined;

  const birthYearNumber = Number(person.birthYear);
  if (Number.isNaN(birthYearNumber)) return undefined;

  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYearNumber;

  return age <= 110;
}

function computeHidden(person: FamilyGraphPerson | undefined): boolean {
  if (!person) return false;

  const override = PERSON_UI_OVERRIDES[person.id];
  if (typeof override?.hidden === "boolean") {
    return override.hidden;
  }

  return computeIsPossiblyAlive(person) != false;
}

function normalizeLastName(lastName?: string): string {
  if (!lastName) return "";
  if (lastName === "? SANS NOM") return "";
  if (lastName === "? NOM INCONNU") return "";
  return lastName;
}

function toSummary(
  person: FamilyGraphPerson | undefined,
  subtitle: string,
  extra?: Partial<PersonSummary>,
): PersonSummary | null {
  if (!person) return null;

  const override = PERSON_UI_OVERRIDES[person.id] ?? {};

  return {
    id: person.id,
    firstName: person.firstName || "",
    lastName: normalizeLastName(person.lastName),
    nickname: person.nickname || "",
    sex: person.sex,
    subtitle: override.subtitle ?? subtitle ?? defaultSubtitleForSex(person.sex),
    birthYear: person.birthYear,
    deathYear: person.deathYear,
    birthPlace: person.birthPlace,
    deathPlace: person.deathPlace,
    branch: person.branch,
    isPossiblyAlive: computeIsPossiblyAlive(person),
    hidden: computeHidden(person),
    ...override,
    ...extra,
  };
}

function getFamily(
  graph: FamilyGraphData,
  familyId: string,
): FamilyGraphFamily | undefined {
  return graph.families[familyId];
}

function getPerson(
  graph: FamilyGraphData,
  personId?: string,
): FamilyGraphPerson | undefined {
  if (!personId) return undefined;
  return graph.people[personId];
}

function getSpouseIdForFamily(
  personId: string,
  family: FamilyGraphFamily,
): string | undefined {
  if (family.husbandId === personId) return family.wifeId;
  if (family.wifeId === personId) return family.husbandId;
  return undefined;
}

function getParentIds(
  person: FamilyGraphPerson,
  graph: FamilyGraphData,
): string[] {
  return person.famcIds
    .map((id) => getFamily(graph, id))
    .filter((f): f is FamilyGraphFamily => Boolean(f))
    .flatMap((fam) => [fam.husbandId, fam.wifeId])
    .filter((id): id is string => Boolean(id));
}

export function buildPersonContext(
  personId: string,
  graph: FamilyGraphData,
): PersonContext {
  const person = graph.people[personId];
  if (!person) {
    throw new Error(`Personne introuvable: ${personId}`);
  }

  const parentFamilies = person.famcIds
    .map((id) => getFamily(graph, id))
    .filter((f): f is FamilyGraphFamily => Boolean(f));

  const spouseFamilies = person.famsIds
    .map((id) => getFamily(graph, id))
    .filter((f): f is FamilyGraphFamily => Boolean(f));

  const spouses = uniqueById(
    spouseFamilies.map((fam) => {
      const spouseId = getSpouseIdForFamily(personId, fam);
      const spouse = getPerson(graph, spouseId);

      return toSummary(spouse, getSpouseSubtitle(spouse?.sex), {
        spouseRoleLabel: fam.childIds.length
          ? `${(spouse?.sex === "F") ? "Mère" : (spouse?.sex === "M") ? "Père" : "Parent"} de ${fam.childIds.length ==1 ? "un ": fam.childIds.length} enfant${fam.childIds.length>1?"s":""}`
          : undefined,
      });
    }),
  );

  const spouseByFamilyId = new Map<string, PersonSummary | undefined>();
  spouseFamilies.forEach((fam, index) => {
    spouseByFamilyId.set(fam.id, spouses[index]);
  });

  const parents = uniqueById(
    parentFamilies.flatMap((fam) => {
      const father = getPerson(graph, fam.husbandId);
      const mother = getPerson(graph, fam.wifeId);

      return [
        toSummary(father, getParentSubtitle(father?.sex)),
        toSummary(mother, getParentSubtitle(mother?.sex)),
      ];
    }),
  );

  const children = uniqueById(
    spouseFamilies.flatMap((fam) =>
      fam.childIds.map((childId) => {
        const child = getPerson(graph, childId);

        return toSummary(child, getChildSubtitle(child?.sex), {
          linkedSpouseLabel: formatLinkedSpouseLabel(spouseByFamilyId.get(fam.id)),
        });
      }),
    ),
  );

  const personParentIds = new Set(getParentIds(person, graph));

  const siblings = uniqueById(
    parents.flatMap((parentSummary) => {
      const parent = graph.people[parentSummary.id];
      if (!parent) return [];

      const parentSpouseFamilies = parent.famsIds
        .map((id) => getFamily(graph, id))
        .filter((f): f is FamilyGraphFamily => Boolean(f));

      return parentSpouseFamilies.flatMap((fam) =>
        fam.childIds
          .filter((id) => id !== personId)
          .map((siblingId) => {
            const sibling = getPerson(graph, siblingId);
            if (!sibling) return null;

            const siblingParentIds = getParentIds(sibling, graph);

            return toSummary(
              sibling,
              getSiblingSubtitleFromSharedParents(
                sibling.sex,
                siblingParentIds,
                personParentIds,
                graph,
              ),
            );
          }),
      );
    }),
  );

  const grandparents = uniqueById(
    parents.flatMap((parentSummary) => {
      const parent = graph.people[parentSummary.id];
      if (!parent) return [];

      const gpFamilies = parent.famcIds
        .map((id) => getFamily(graph, id))
        .filter((f): f is FamilyGraphFamily => Boolean(f));

      return gpFamilies.flatMap((fam) => {
        const grandfather = getPerson(graph, fam.husbandId);
        const grandmother = getPerson(graph, fam.wifeId);

        return [
          toSummary(grandfather, getGrandparentSubtitle(grandfather?.sex)),
          toSummary(grandmother, getGrandparentSubtitle(grandmother?.sex)),
        ];
      });
    }),
  );

  return {
    person:
      toSummary(person, defaultSubtitleForSex(person.sex)) ??
      ({
        id: person.id,
        firstName: person.firstName,
        lastName: normalizeLastName(person.lastName),
        nickname: person.nickname,
        sex: person.sex,
        subtitle: defaultSubtitleForSex(person.sex),
        branch: person.branch,
        isPossiblyAlive: computeIsPossiblyAlive(person),
        hidden: computeHidden(person),
      } satisfies PersonSummary),
    parents,
    spouses,
    children,
    siblings,
    grandparents,
  };
}

export function buildAllPersonContexts(
  graph: FamilyGraphData,
): Record<string, PersonContext> {
  const result: Record<string, PersonContext> = {};

  for (const personId of Object.keys(graph.people)) {
    result[personId] = buildPersonContext(personId, graph);
  }

  return result;
}