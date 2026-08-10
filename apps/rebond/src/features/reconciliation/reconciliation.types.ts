// reconciliation.types.ts — types UI pour le module Réconciliation.
//
// Réconciliation est le SEUL module qui écrit une fusion d'identité — les
// autres (Entités notamment) ne font que lire le résultat. Détection de
// candidats volontairement simple (libellé identique, pas d'IA) pour cette
// première version : voir reconciliation.service.ts.

import type { EntityType } from '../entites/entites.types'

export type MergeCandidate = {
  entityId: string
  label: string
  factsCount: number
  documentsCount: number
}

export type MergeCandidateGroup = {
  entityType: EntityType
  normalizedLabel: string
  members: MergeCandidate[]
}
