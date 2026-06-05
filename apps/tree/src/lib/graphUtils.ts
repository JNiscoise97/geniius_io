import type { FamilyGraphFamily, FamilyGraphPerson } from '@geniius/utils/family-graph'

type GraphLike = {
  people:   Record<string, FamilyGraphPerson>
  families: Record<string, FamilyGraphFamily>
}

// BFS : retourne le Set des IDs liés par le sang ou le mariage depuis une racine
export function buildBloodAndSpousesSet(graph: GraphLike, rootId: string): Set<string> {
  const bloodIds = new Set<string>()
  const queue: string[] = [rootId]

  while (queue.length > 0) {
    const id = queue.shift()!
    if (bloodIds.has(id)) continue
    bloodIds.add(id)

    const person = graph.people[id]
    if (!person) continue

    for (const famcId of person.famcIds) {
      const fam = graph.families[famcId]
      if (!fam) continue
      if (fam.husbandId && !bloodIds.has(fam.husbandId)) queue.push(fam.husbandId)
      if (fam.wifeId    && !bloodIds.has(fam.wifeId))    queue.push(fam.wifeId)
    }
    for (const famsId of person.famsIds) {
      const fam = graph.families[famsId]
      if (!fam) continue
      for (const childId of fam.childIds) {
        if (!bloodIds.has(childId)) queue.push(childId)
      }
    }
  }

  const result = new Set<string>(bloodIds)
  for (const id of bloodIds) {
    const person = graph.people[id]
    if (!person) continue
    for (const famsId of person.famsIds) {
      const fam = graph.families[famsId]
      if (!fam) continue
      if (fam.husbandId) result.add(fam.husbandId)
      if (fam.wifeId)    result.add(fam.wifeId)
    }
  }
  return result
}
