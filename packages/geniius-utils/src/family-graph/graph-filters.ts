import {
  FamilyGraphData,
  FamilyGraphFamily,
  FamilyGraphPerson,
  normalizeId,
} from "./gedcom-parser";

type FamilyIndexes = {
  familiesByChildId: Map<string, FamilyGraphFamily[]>;
  familiesByParentId: Map<string, FamilyGraphFamily[]>;
};

function buildFamilyIndexes(graph: FamilyGraphData): FamilyIndexes {
  const familiesByChildId = new Map<string, FamilyGraphFamily[]>();
  const familiesByParentId = new Map<string, FamilyGraphFamily[]>();

  function pushToMap(
    map: Map<string, FamilyGraphFamily[]>,
    key: string,
    family: FamilyGraphFamily,
  ) {
    const existing = map.get(key);

    if (existing) {
      existing.push(family);
    } else {
      map.set(key, [family]);
    }
  }

  for (const family of Object.values(graph.families)) {
    for (const childId of family.childIds) {
      pushToMap(familiesByChildId, childId, family);
    }

    if (family.husbandId) {
      pushToMap(familiesByParentId, family.husbandId, family);
    }

    if (family.wifeId) {
      pushToMap(familiesByParentId, family.wifeId, family);
    }
  }

  return {
    familiesByChildId,
    familiesByParentId,
  };
}

function collectAncestorIds(
  graph: FamilyGraphData,
  rootPersonId: string,
  indexes: FamilyIndexes,
): Set<string> {
  if (!graph.people[rootPersonId]) {
    throw new Error(`Personne racine introuvable: ${rootPersonId}`);
  }

  const ancestorIds = new Set<string>();
  const queue: string[] = [rootPersonId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (ancestorIds.has(currentId)) continue;

    ancestorIds.add(currentId);

    const parentFamilies = indexes.familiesByChildId.get(currentId) ?? [];

    for (const family of parentFamilies) {
      if (family.husbandId && !ancestorIds.has(family.husbandId)) {
        queue.push(family.husbandId);
      }

      if (family.wifeId && !ancestorIds.has(family.wifeId)) {
        queue.push(family.wifeId);
      }
    }
  }

  return ancestorIds;
}

function collectDescendantIdsFromSeeds(
  indexes: FamilyIndexes,
  seedIds: Iterable<string>,
): Set<string> {
  const descendantIds = new Set<string>();
  const queue = Array.from(seedIds);

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (descendantIds.has(currentId)) continue;

    descendantIds.add(currentId);

    const childFamilies = indexes.familiesByParentId.get(currentId) ?? [];

    for (const family of childFamilies) {
      for (const childId of family.childIds) {
        if (!descendantIds.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  return descendantIds;
}

function collectBloodRelativeIds(
  graph: FamilyGraphData,
  rootPersonId: string,
): Set<string> {
  const indexes = buildFamilyIndexes(graph);
  const ancestorIds = collectAncestorIds(graph, rootPersonId, indexes);

  return collectDescendantIdsFromSeeds(indexes, ancestorIds);
}

function collectSpouseIdsForBloodPeople(
  graph: FamilyGraphData,
  bloodIds: Set<string>,
): Set<string> {
  const spouseIds = new Set<string>();

  for (const family of Object.values(graph.families)) {
    const { husbandId, wifeId } = family;

    if (!husbandId || !wifeId) continue;

    const husbandIsBlood = bloodIds.has(husbandId);
    const wifeIsBlood = bloodIds.has(wifeId);

    if (husbandIsBlood && !wifeIsBlood && graph.people[wifeId]) {
      spouseIds.add(wifeId);
    }

    if (wifeIsBlood && !husbandIsBlood && graph.people[husbandId]) {
      spouseIds.add(husbandId);
    }
  }

  return spouseIds;
}

function collectDirectDescendantIds(
  graph: FamilyGraphData,
  rootPersonId: string,
): Set<string> {
  if (!graph.people[rootPersonId]) {
    return new Set<string>();
  }

  const indexes = buildFamilyIndexes(graph);

  return collectDescendantIdsFromSeeds(indexes, [rootPersonId]);
}

export function filterGraphToBloodRelativesAndSpouses(
  graph: FamilyGraphData,
  rawRootPersonId: string,
): FamilyGraphData {
  const rootPersonId = normalizeId(rawRootPersonId);

  const bloodIds = collectBloodRelativeIds(graph, rootPersonId);
  const spouseIds = collectSpouseIdsForBloodPeople(graph, bloodIds);
  const keptIds = new Set<string>([...bloodIds, ...spouseIds]);

  const filteredFamilies: Record<string, FamilyGraphFamily> = {};

  for (const [familyId, family] of Object.entries(graph.families)) {
    const husbandKept = family.husbandId ? keptIds.has(family.husbandId) : false;
    const wifeKept = family.wifeId ? keptIds.has(family.wifeId) : false;
    const keptChildren = family.childIds.filter((childId) =>
      keptIds.has(childId),
    );

    if (!husbandKept && !wifeKept && keptChildren.length === 0) {
      continue;
    }

    filteredFamilies[familyId] = {
      id: family.id,
      husbandId: husbandKept ? family.husbandId : undefined,
      wifeId: wifeKept ? family.wifeId : undefined,
      childIds: keptChildren,
    };
  }

  const filteredPeople: Record<string, FamilyGraphPerson> = {};

  for (const [personId, person] of Object.entries(graph.people)) {
    if (!keptIds.has(personId)) continue;

    filteredPeople[personId] = {
      ...person,
      famcIds: person.famcIds.filter((famId) =>
        Boolean(filteredFamilies[famId]),
      ),
      famsIds: person.famsIds.filter((famId) =>
        Boolean(filteredFamilies[famId]),
      ),
    };
  }

  return {
    people: filteredPeople,
    families: filteredFamilies,
  };
}

export function excludeIndividuals(
  graph: FamilyGraphData,
  excludedPersonIds: string[],
): FamilyGraphData {
  const excludedIds = new Set(excludedPersonIds.map((id) => normalizeId(id)));

  const filteredFamilies: Record<string, FamilyGraphFamily> = {};

  for (const [familyId, family] of Object.entries(graph.families)) {
    const husbandId =
      family.husbandId && !excludedIds.has(family.husbandId)
        ? family.husbandId
        : undefined;

    const wifeId =
      family.wifeId && !excludedIds.has(family.wifeId)
        ? family.wifeId
        : undefined;

    const childIds = family.childIds.filter(
      (childId) => !excludedIds.has(childId),
    );

    if (!husbandId && !wifeId && childIds.length === 0) {
      continue;
    }

    filteredFamilies[familyId] = {
      id: family.id,
      husbandId,
      wifeId,
      childIds,
    };
  }

  const filteredPeople: Record<string, FamilyGraphPerson> = {};

  for (const [personId, person] of Object.entries(graph.people)) {
    if (excludedIds.has(personId)) continue;

    filteredPeople[personId] = {
      ...person,
      famcIds: person.famcIds.filter((famId) =>
        Boolean(filteredFamilies[famId]),
      ),
      famsIds: person.famsIds.filter((famId) =>
        Boolean(filteredFamilies[famId]),
      ),
    };
  }

  return {
    people: filteredPeople,
    families: filteredFamilies,
  };
}

export function assignBranches(
  graph: FamilyGraphData,
  rawBranchRootIds: string[],
): FamilyGraphData {
  const branchRootIds = rawBranchRootIds.map((id) => normalizeId(id));
  const descendantIdsByBranch = new Map<string, Set<string>>();

  for (const branchRootId of branchRootIds) {
    descendantIdsByBranch.set(
      branchRootId,
      collectDirectDescendantIds(graph, branchRootId),
    );
  }

  const people: Record<string, FamilyGraphPerson> = {};

  for (const [personId, person] of Object.entries(graph.people)) {
    const branches: string[] = [];

    for (const branchRootId of branchRootIds) {
      const descendantIds = descendantIdsByBranch.get(branchRootId);

      if (descendantIds?.has(person.id)) {
        branches.push(branchRootId);
      }
    }

    people[personId] = {
      ...person,
      branch: branches.length > 0 ? branches : person.branch,
    };
  }

  return {
    people,
    families: graph.families,
  };
}