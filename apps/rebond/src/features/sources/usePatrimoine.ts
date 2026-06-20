// usePatrimoine.ts
// Hook principal pour la page Patrimoine documentaire.
// Orchestre les 4 requêtes Supabase et adapte les résultats
// vers les types UI utilisés par SourcesCorpusPage.

import { useState, useEffect, useCallback } from 'react'
import {
  fetchSources, fetchDocuments, fetchOrphans, fetchCorpus, fetchCitationsWithExemplaires, insertDocumentUD,
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
    producteur: row.producteur ?? null,
    institution_conservation:
      row.institution_conservation ?? row.depot_nom ?? 'Institution inconnue',
    localisation: row.localisation ?? [row.ville, row.pays].filter(Boolean).join(', ') ?? '',
    territoire: row.territoire ?? null,
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
  }
}

function toDocument(row: UDDocRow): PatrimoineDocument {
  const ex = row.ref_exemplaires?.[0]
  const coteFromMeta = row.metadonnees?.cote as string | undefined
  const noteFromMeta = row.metadonnees?.note as string | undefined

  return {
    id: row.id,
    source_id: row.parent_ud_id ?? null,
    type_document: toSourceType(row.metadonnees) as SourceType | null,
    role: (row.role_document as DocRole | null) ?? null,
    cote: ex?.cote_locale ?? coteFromMeta ?? '?',
    titre: row.titre,
    date_document: row.couverture_label ?? null,
    statut: (row.workflow_statut as DocStatut) ?? 'en_attente',
    niveau_conservation: toConservation(null),
    note: ex?.note ?? noteFromMeta ?? undefined,
    decouverte_via_id: row.decouverte_via_id ?? undefined,
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [sourcesRes, docsRes, orphansRes, corpusRes, citationsRes] = await Promise.all([
      fetchSources(),
      fetchDocuments(),
      fetchOrphans(),
      fetchCorpus(),
      fetchCitationsWithExemplaires(),
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

    setSources(mappedSources)
    setDocs(mappedDocs)
    setCorpus(mappedCorpus)
    setCitationsData(citationsRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addDoc = useCallback(async (payload: {
    titre: string
    parent_ud_id: string | null
    couverture_label?: string | null
    cote?: string | null
    note?: string | null
  }) => {
    const { error } = await insertDocumentUD(payload)
    if (error) throw error
    await load()
  }, [load])

  return { sources, docs, corpus, citationsData, loading, error, refetch: load, addDoc }
}
