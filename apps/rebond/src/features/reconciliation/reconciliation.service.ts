// reconciliation.service.ts — accès données pour le module Réconciliation.
//
// Détection de candidats volontairement simple pour cette première version
// (libellé strictement identique, une fois normalisé — pas d'IA, pas de
// similarité floue) : "commencer manuel, ajouter de l'assistance IA
// seulement si le volume le justifie", doctrine posée explicitement avec
// l'utilisateur. Voir schema-docs/entities.md pour le reste de la doctrine
// (répartition des responsabilités entre Entités et Réconciliation).

import { supabaseRebond } from '@/lib/supabase'
import { computeEntityCounts } from '../entites/entites.service'
import type { EntityType } from '../entites/entites.types'
import type { MergeCandidateGroup } from './reconciliation.types'

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase()
}

export async function fetchMergeCandidates(): Promise<MergeCandidateGroup[]> {
  const { data: entities, error } = await supabaseRebond.from('entities')
    .select('id, entity_type, label')
    .is('merged_into_id', null)
    .order('label', { ascending: true })
  if (error) throw error
  if (!entities?.length) return []

  const { data: dismissals } = await supabaseRebond.from('entity_merge_dismissals')
    .select('entity_type, normalized_label')
  const dismissedKeys = new Set((dismissals ?? []).map(d => `${d.entity_type}|${d.normalized_label}`))

  const groups = new Map<string, { entityType: EntityType; normalizedLabel: string; ids: string[] }>()
  for (const e of entities) {
    const normalized = normalizeLabel(e.label)
    const key = `${e.entity_type}|${normalized}`
    if (dismissedKeys.has(key)) continue
    const g = groups.get(key) ?? { entityType: e.entity_type as EntityType, normalizedLabel: normalized, ids: [] }
    g.ids.push(e.id)
    groups.set(key, g)
  }

  const candidateGroups = [...groups.values()].filter(g => g.ids.length > 1)
  if (candidateGroups.length === 0) return []

  const allIds = candidateGroups.flatMap(g => g.ids)
  const counts = await computeEntityCounts(allIds)
  const labelById = new Map(entities.map(e => [e.id, e.label]))

  return candidateGroups.map(g => ({
    entityType: g.entityType,
    normalizedLabel: g.normalizedLabel,
    members: g.ids.map(id => ({
      entityId: id,
      label: labelById.get(id) ?? g.normalizedLabel,
      factsCount: counts.get(id)?.factsCount ?? 0,
      documentsCount: counts.get(id)?.documentsCount ?? 0,
    })),
  }))
}

// Fusionne mergedIds dans survivorId : tous les entity_links pointent
// désormais vers le survivant, les entités fusionnées sont marquées
// merged_into_id (conservées, pas supprimées — une entité fusionnée garde
// son id pour qu'un lien existant vers elle reste résoluble plus tard si
// besoin, plutôt que de casser une référence).
export async function mergeEntities(survivorId: string, mergedIds: string[]): Promise<void> {
  const targets = mergedIds.filter(id => id !== survivorId)
  if (targets.length === 0) return

  const { error: relinkErr } = await supabaseRebond.from('entity_links')
    .update({ entity_id: survivorId })
    .in('entity_id', targets)
  if (relinkErr) throw relinkErr

  const { error: mergeErr } = await supabaseRebond.from('entities')
    .update({ merged_into_id: survivorId })
    .in('id', targets)
  if (mergeErr) throw mergeErr
}

export async function dismissGroup(entityType: EntityType, normalizedLabel: string): Promise<void> {
  const { error } = await supabaseRebond.from('entity_merge_dismissals')
    .insert({ entity_type: entityType, normalized_label: normalizedLabel })
  if (error) throw error
}
