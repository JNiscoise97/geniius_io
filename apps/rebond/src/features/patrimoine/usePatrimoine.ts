// usePatrimoine.ts
// Hook principal pour la page Patrimoine documentaire.
// Orchestre les 4 requêtes Supabase et adapte les résultats
// vers les types UI utilisés par PatrimoineDocumentairePage.

import { useState, useEffect, useCallback } from 'react'
import {
  fetchSources, fetchDocuments, fetchOrphans, fetchCorpus, fetchCitationsWithExemplaires, fetchMentions,
  CITATION_ACTE_TARGET_TYPES,
  type VSourceRow, type UDDocRow, type CorpusDBRow, type CitationExemplaireRow,
} from './patrimoine.service'
import type {
  PatrimoineSource, PatrimoineDocument, PatrimoineCorpus,
  SourceType, SourceStatut, Acces, DocStatut, DocRole, NiveauConservation, CorpusType,
} from './source.types'

// ── Helpers ───────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 2) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} jour${days > 1 ? 's' : ''}`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const DOMAINE_MAP: Record<string, SourceType> = {
  'etat-civil': 'etat-civil',
  'etat_civil': 'etat-civil',
  foncier: 'foncier',
  annuaire: 'annuaire',
  notarial: 'notarial',
  paroissial: 'paroissial',
}

function toSourceType(meta: Record<string, unknown> | null): SourceType {
  const domaine = meta?.domaine as string | undefined
  return DOMAINE_MAP[domaine ?? ''] ?? 'etat-civil'
}

const CONSERVATION_MAP: Record<string, NiveauConservation> = {
  'bon': 'bon', 'bon état': 'bon', 'good': 'bon',
  'moyen': 'moyen', 'état moyen': 'moyen', 'fair': 'moyen',
  'dégradé': 'degrade', 'degradé': 'degrade', 'poor': 'degrade',
  'fragmentaire': 'fragmentaire', 'partial': 'fragmentaire',
}

function toConservation(label: string | null): NiveauConservation | null {
  if (!label) return null
  return CONSERVATION_MAP[label.toLowerCase()] ?? null
}

// ── Adapters ──────────────────────────────────────────────────

function toSource(row: VSourceRow): PatrimoineSource {
  return {
    id: row.unite_documentaire_id,
    nom: row.nom,
    type: toSourceType(row.metadonnees),
    institution_conservation:
      row.institution_conservation ?? row.depot_nom ?? 'Institution inconnue',
    localisation: row.localisation ?? [row.ville, row.pays].filter(Boolean).join(', ') ?? '',
    periode: row.periode ?? 'non renseigné',
    niveau_fiabilite: (row.niveau_fiabilite as 'haute' | 'moyenne' | 'basse' | null) ?? null,
    acces: (row.acces as Acces) ?? 'physique',
    url: row.url ?? undefined,
    total_documents: row.total_documents ?? 0,
    transcris: row.transcris ?? 0,
    en_cours: row.en_cours ?? 0,
    a_traiter: row.a_traiter ?? 0,
    statut: (row.statut as SourceStatut) ?? 'actif',
    derniere_activite: relativeTime(row.derniere_activite),
    copies_connues: row.copies_connues ?? 0,
    vue_range: row.vue_range ?? null,
    a_rattacher: row.metadonnees?.a_rattacher === true,
  }
}

function toDocument(row: UDDocRow): PatrimoineDocument {
  const exemplaires = row.ref_exemplaires ?? []
  // L'exemplaire de référence fait foi pour cote/vue quand il y en a
  // plusieurs — à défaut (aucun désigné), on retombe sur le premier connu.
  const ex = exemplaires.find(e => e.est_reference) ?? exemplaires[0]
  const coteFromMeta = row.metadonnees?.cote as string | undefined
  const noteFromMeta = row.metadonnees?.note as string | undefined
  const urlBase = ex?.ref_acces_numeriques?.find(a => (a.url_base ?? '').trim())?.url_base ?? undefined

  // "Vue" : la citation (CITATION_ACTE_TARGET_TYPES — patrimoine.service.ts)
  // est la source active — c'est elle que la sheet "Décrire" met à jour. On
  // ne retombe sur ref_exemplaires.localisation_interne (posé une seule fois
  // par le wizard, jamais réédité) que si aucune citation n'existe (ex. un
  // registre).
  const citation = ex?.citations?.find(c => (CITATION_ACTE_TARGET_TYPES as readonly string[]).includes(c.target_type))
  const sys0 = citation?.locating?.systems?.[0]
  // raw texte libre en priorité (forme canonique systems[0].raw, avec repli sur l'ancien
  // locating.raw à la racine pour les citations enregistrées avant le correctif de forme) ;
  // à défaut, plage numérique start–end si c'est ce qui a été saisi (ex. "vue 12–14").
  const rawText = (sys0?.raw ?? citation?.locating?.raw)?.trim() || undefined
  const rangeText = sys0?.start != null
    ? (sys0.end != null && sys0.end !== sys0.start ? `${sys0.start}–${sys0.end}` : String(sys0.start))
    : undefined
  const citationRaw = rawText ?? rangeText
  const vue = citationRaw ?? (ex?.localisation_interne ?? null)

  return {
    id: row.id,
    source_id: row.parent_ud_id ?? null,
    type_document: toSourceType(row.metadonnees) as SourceType | null,
    role: (row.ref_role_document?.code as DocRole | null) ?? null,
    cote: ex?.cote_locale ?? coteFromMeta ?? '?',
    titre: row.titre,
    date_document: row.couverture_label ?? null,
    statut: (row.workflow_statut as DocStatut) ?? 'en_attente',
    niveau_conservation: toConservation(null),
    note: ex?.note ?? noteFromMeta ?? undefined,
    vue,
    serie: row.ref_series_documentaires?.label ?? null,
    en_ligne: Boolean(urlBase),
    url: urlBase,
    a_rattacher: row.metadonnees?.a_rattacher === true,
    exemplaire_count: exemplaires.length,
  }
}

function toCorpus(row: CorpusDBRow, allSources: PatrimoineSource[]): PatrimoineCorpus {
  const sourceIds = (row.corpus_unites ?? []).map(cu => cu.unite_documentaire_id)
  const linked = allSources.filter(s => sourceIds.includes(s.id))
  const totalDocs = linked.reduce((acc, s) => acc + s.total_documents, 0)
  const transcris = linked.reduce((acc, s) => acc + s.transcris, 0)

  return {
    id: row.id,
    nom: row.nom,
    description: row.description ?? '',
    type: (row.type as CorpusType) ?? 'genealogique',
    source_ids: sourceIds,
    total_documents: totalDocs,
    transcris,
    cree_par: '—',
    cree_le: new Date(row.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    }),
  }
}

// ── Hook ──────────────────────────────────────────────────────

export function usePatrimoine() {
  const [sources, setSources] = useState<PatrimoineSource[]>([])
  const [docs, setDocs] = useState<PatrimoineDocument[]>([])
  const [corpus, setCorpus] = useState<PatrimoineCorpus[]>([])
  const [citationsData, setCitationsData] = useState<CitationExemplaireRow[]>([])
  // "Mentionné dans" (unites_documentaires_mentions) : clé = id de l'acte
  // mentionné, valeur = les tables qui le mentionnent. Distinct du
  // containment porté par parent_ud_id/source_id.
  const [mentionsByDoc, setMentionsByDoc] = useState<Map<string, Array<{ id: string; titre: string }>>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [sourcesRes, docsRes, orphansRes, corpusRes, citationsRes, mentionsRes] = await Promise.all([
      fetchSources(),
      fetchDocuments(),
      fetchOrphans(),
      fetchCorpus(),
      fetchCitationsWithExemplaires(),
      fetchMentions(),
    ])

    if (sourcesRes.error) {
      setError(sourcesRes.error.message)
      setLoading(false)
      return
    }

    const sourceRows = sourcesRes.data ?? []
    const docRows = docsRes.data ?? []
    const orphanRows = orphansRes.data ?? []
    const corpusRows = corpusRes.data ?? []

    const mappedSources = sourceRows.map(toSource)
    const mappedDocs = [
      ...docRows.map(toDocument),
      ...orphanRows.map(toDocument),
    ]
    const mappedCorpus = corpusRows.map(row => toCorpus(row, mappedSources))

    const mentionsMap = new Map<string, Array<{ id: string; titre: string }>>()
    for (const m of mentionsRes.data ?? []) {
      if (!m.mentionnant) continue
      const list = mentionsMap.get(m.mentionne_id) ?? []
      list.push(m.mentionnant)
      mentionsMap.set(m.mentionne_id, list)
    }

    // Un document encore en_attente n'a pas fini "Décrire" — pas la peine de
    // le montrer dans l'onglet Exemplaires, il est déjà dans "Documents à
    // décrire" (En attente). Évite qu'un même document soit actionnable
    // depuis deux endroits avec deux notions de complétude différentes.
    const enAttenteIds = new Set(mappedDocs.filter(d => d.statut === 'en_attente').map(d => d.id))
    const filteredCitations = (citationsRes.data ?? []).filter(c => !c.unite_id || !enAttenteIds.has(c.unite_id))

    setSources(mappedSources)
    setDocs(mappedDocs)
    setCorpus(mappedCorpus)
    setCitationsData(filteredCitations)
    setMentionsByDoc(mentionsMap)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { sources, docs, corpus, citationsData, mentionsByDoc, loading, error, refetch: load }
}
