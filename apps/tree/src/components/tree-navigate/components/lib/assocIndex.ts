/**
 * Singleton de l'index ASSO — construit une seule fois au démarrage.
 * Importer `assocIndex` partout où on en a besoin.
 */
import { graph } from '../../data'
import { buildAssocIndex, type AssocIndex } from './buildAssocIndex'

export { type AssocOccurrence } from './buildAssocIndex'

export const assocIndex: AssocIndex = buildAssocIndex(graph)