/**
 * Index ASSO — construit une seule fois, à la première demande (lazy).
 * Le graphe n'est pas disponible au chargement du module (JSON async),
 * donc on ne peut pas calculer ici au niveau module.
 */
import { graph } from '../../data'
import { buildAssocIndex, type AssocIndex } from './buildAssocIndex'

export { type AssocOccurrence } from './buildAssocIndex'

let _cache: AssocIndex | null = null

export function getAssocIndex(): AssocIndex {
  if (!_cache) _cache = buildAssocIndex(graph)
  return _cache
}
