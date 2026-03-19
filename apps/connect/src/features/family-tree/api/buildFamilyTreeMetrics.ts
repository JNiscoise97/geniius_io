import type { FamilyGraphData, FamilyGraphFamily } from "../types";

export type FamilyTreeMetrics = {
  descendantsCount: number;
  generationsCount: number;
  branchesCount: number;
};

function getFamiliesWherePersonIsParent(
  graph: FamilyGraphData,
  personId: string,
): FamilyGraphFamily[] {
  return Object.values(graph.families).filter(
    (family) => family.husbandId === personId || family.wifeId === personId,
  );
}

function collectDescendants(
  graph: FamilyGraphData,
  rootPersonId: string,
): Map<string, number> {
  const visited = new Map<string, number>();
  const queue: Array<{ personId: string; generation: number }> = [
    { personId: rootPersonId, generation: 1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const knownGeneration = visited.get(current.personId);

    if (
      knownGeneration !== undefined &&
      knownGeneration <= current.generation
    ) {
      continue;
    }

    visited.set(current.personId, current.generation);

    const parentFamilies = getFamiliesWherePersonIsParent(
      graph,
      current.personId,
    );

    for (const family of parentFamilies) {
      for (const childId of family.childIds) {
        queue.push({
          personId: childId,
          generation: current.generation + 1,
        });
      }
    }
  }

  return visited;
}

export function buildFamilyTreeMetrics(
  graph: FamilyGraphData,
  rootPersonId: string,
): FamilyTreeMetrics {
  const descendants = collectDescendants(graph, rootPersonId);
  const people = Array.from(descendants.keys())
    .map((personId) => graph.people[personId])
    .filter(Boolean);

  const descendantsCount = people.length;

  const generationsCount =
    Math.max(...Array.from(descendants.values()), 1);

  const distinctBranches = new Set<string>();

  for (const person of people) {
    for (const branchId of person.branch ?? []) {
      distinctBranches.add(branchId);
    }
  }

  return {
    descendantsCount,
    generationsCount,
    branchesCount: distinctBranches.size,
  };
}