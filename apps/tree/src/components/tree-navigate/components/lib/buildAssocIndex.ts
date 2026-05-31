import { type FamilyGraphData, type GedcomEvent } from '@geniius/utils/family-graph'

/**
 * Un événement où la personne apparaît comme ASSO,
 * avec la référence à l'entité porteuse (personne ou famille).
 */
export type AssocOccurrence = {
  /** L'événement lui-même */
  event: GedcomEvent
  /** ID de la personne ou famille qui porte l'événement */
  ownerId: string
  /** "person" ou "family" */
  ownerKind: 'person' | 'family'
  /** Index de l'assoc dans event.assocs (pour récupérer rôle/note) */
  assocIndex: number
}

/**
 * Index inversé : personId → liste des occurrences ASSO.
 *
 * Construit en O(n) sur l'ensemble du graphe, à appeler une seule fois
 * et à mettre en cache (ex: module-level singleton).
 */
export type AssocIndex = Map<string, AssocOccurrence[]>

export function buildAssocIndex(graph: FamilyGraphData): AssocIndex {
  const index: AssocIndex = new Map()

  const add = (
    personId: string,
    occurrence: AssocOccurrence,
  ) => {
    let list = index.get(personId)
    if (!list) { list = []; index.set(personId, list) }
    list.push(occurrence)
  }

  // Événements des personnes
  for (const person of Object.values(graph.people)) {
    for (const event of person.events) {
      event.assocs.forEach((assoc, assocIndex) => {
        if (!assoc.id) return
        add(assoc.id, {
          event,
          ownerId:   person.id,
          ownerKind: 'person',
          assocIndex,
        })
      })
    }
  }

  // Événements des familles
  for (const family of Object.values(graph.families)) {
    for (const event of family.events) {
      event.assocs.forEach((assoc, assocIndex) => {
        if (!assoc.id) return
        add(assoc.id, {
          event,
          ownerId:   family.id,
          ownerKind: 'family',
          assocIndex,
        })
      })
    }
  }

  return index
}