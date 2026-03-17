import type { FamilyGraphData } from "../types";

export type RelationshipEdgeType = "parent" | "child" | "spouse";

export type RelationshipStep = {
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipEdgeType;
};

export type RelationshipPathNode = {
  personId: string;
  via?: RelationshipEdgeType;
};

function addEdge(
  adjacency: Map<string, RelationshipStep[]>,
  fromPersonId: string,
  toPersonId: string,
  type: RelationshipEdgeType,
) {
  if (!adjacency.has(fromPersonId)) {
    adjacency.set(fromPersonId, []);
  }

  adjacency.get(fromPersonId)!.push({
    fromPersonId,
    toPersonId,
    type,
  });
}

function buildRelationshipAdjacency(
  graph: FamilyGraphData,
): Map<string, RelationshipStep[]> {
  const adjacency = new Map<string, RelationshipStep[]>();

  for (const person of Object.values(graph.people)) {
    if (!adjacency.has(person.id)) {
      adjacency.set(person.id, []);
    }
  }

  for (const family of Object.values(graph.families)) {
    const parentIds = [family.husbandId, family.wifeId].filter(
      (id): id is string => Boolean(id),
    );

    for (const childId of family.childIds) {
      for (const parentId of parentIds) {
        addEdge(adjacency, parentId, childId, "child");
        addEdge(adjacency, childId, parentId, "parent");
      }
    }

    if (family.husbandId && family.wifeId) {
      addEdge(adjacency, family.husbandId, family.wifeId, "spouse");
      addEdge(adjacency, family.wifeId, family.husbandId, "spouse");
    }
  }

  return adjacency;
}

export function findRelationshipPath(
  graph: FamilyGraphData,
  fromPersonId: string,
  toPersonId: string,
): RelationshipPathNode[] | null {
  if (fromPersonId === toPersonId) {
    return [{ personId: fromPersonId }];
  }

  const adjacency = buildRelationshipAdjacency(graph);
  const queue: string[] = [fromPersonId];
  const visited = new Set<string>([fromPersonId]);

  const previous = new Map<
    string,
    { personId: string; via: RelationshipEdgeType }
  >();

  while (queue.length > 0) {
    const currentPersonId = queue.shift()!;
    const neighbors = adjacency.get(currentPersonId) ?? [];

    for (const edge of neighbors) {
      if (visited.has(edge.toPersonId)) continue;

      visited.add(edge.toPersonId);
      previous.set(edge.toPersonId, {
        personId: currentPersonId,
        via: edge.type,
      });

      if (edge.toPersonId === toPersonId) {
        const reversedPath: RelationshipPathNode[] = [];
        let cursor: string | undefined = toPersonId;

        while (cursor) {
          const prev = previous.get(cursor);

          reversedPath.push({
            personId: cursor,
            via: prev?.via,
          });

          cursor = prev?.personId;
        }

        const path = reversedPath.reverse();
        if (path.length > 0) {
          path[0] = { personId: path[0].personId };
        }
        return path;
      }

      queue.push(edge.toPersonId);
    }
  }

  return null;
}
