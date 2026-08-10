// dashboard.service.ts — métriques réelles pour les cartes du Dashboard.
//
// Comptages légers (head:true, pas de lignes rapatriées) plutôt que de
// réutiliser les hooks complets des modules (usePatrimoine...) qui font des
// jointures profondes inutiles ici — le Dashboard n'a besoin que de
// nombres, pas des lignes détaillées.

import { supabaseRebond } from '@/lib/supabase'
import { fetchExtractableExemplaires } from '../extraction/extraction.service'
import { fetchMergeCandidates } from '../reconciliation/reconciliation.service'

export type DashboardMetrics = {
  patrimoine: { sources: number; documents: number; enAttente: number; corpus: number }
  atelier: { transcrits: number; aTranscrire: number }
  extraction: { extraits: number; aExtraire: number }
  entites: { total: number }
  reconciliation: { groupes: number }
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    { count: sources },
    { count: documents },
    { count: enAttente },
    { count: corpus },
    { count: totalExemplaires },
    { count: transcrits },
    { count: entitesTotal },
    extractable,
    mergeCandidates,
  ] = await Promise.all([
    supabaseRebond.from('unites_documentaires').select('id', { count: 'exact', head: true }).is('parent_ud_id', null),
    supabaseRebond.from('unites_documentaires').select('id', { count: 'exact', head: true }).not('parent_ud_id', 'is', null),
    supabaseRebond.from('unites_documentaires').select('id', { count: 'exact', head: true }).eq('statut_document', 'en_attente'),
    supabaseRebond.from('corpus').select('id', { count: 'exact', head: true }),
    supabaseRebond.from('exemplaires').select('id', { count: 'exact', head: true }),
    supabaseRebond.from('transcriptions').select('id', { count: 'exact', head: true }).eq('statut', 'termine'),
    supabaseRebond.from('entities').select('id', { count: 'exact', head: true }).is('merged_into_id', null),
    fetchExtractableExemplaires(),
    fetchMergeCandidates(),
  ])

  const extraits = extractable.filter(e => e.assertionsCount > 0).length

  return {
    patrimoine: { sources: sources ?? 0, documents: documents ?? 0, enAttente: enAttente ?? 0, corpus: corpus ?? 0 },
    atelier: {
      transcrits: transcrits ?? 0,
      aTranscrire: Math.max(0, (totalExemplaires ?? 0) - (transcrits ?? 0)),
    },
    extraction: {
      extraits,
      aExtraire: Math.max(0, extractable.length - extraits),
    },
    entites: { total: entitesTotal ?? 0 },
    reconciliation: { groupes: mergeCandidates.length },
  }
}
