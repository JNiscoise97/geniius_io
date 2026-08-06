// patrimoine.service.ts
// Requêtes Supabase pour la page Patrimoine documentaire.
// Toutes les fonctions retournent { data, error } sans throw.

import { supabaseRebond } from '@/lib/supabase'
import type { LocatingJson, MarginaliaJson } from './citationJsonb'

// ── Types DB bruts ────────────────────────────────────────────

export type VSourceRow = {
  exemplaire_id: string
  unite_documentaire_id: string
  nom: string
  type_unite_ref: string
  statut: string
  workflow_statut: string
  niveau_fiabilite: string | null
  periode: string | null
  couverture_sort_start: number | null
  couverture_sort_end: number | null
  cote: string | null
  note: string | null
  nature: string | null
  etat_conservation: string | null
  depot_id: string | null
  depot_nom: string | null
  is_physical: boolean | null
  is_online: boolean | null
  ville: string | null
  pays: string | null
  conditions_communication: string | null
  institution_id: string | null
  institution_conservation: string | null
  institution_sigle: string | null
  localisation: string | null
  url_base: string | null
  url: string | null
  type_acces_id: string | null
  acces: string
  copies_connues: number
  total_documents: number
  transcris: number
  en_cours: number
  a_traiter: number
  metadonnees: Record<string, unknown> | null
  parent_ud_id: string | null
  created_at: string
  derniere_activite: string
}

export type UDDocRow = {
  id: string
  parent_ud_id: string | null
  type_unite_ref: string | null
  role_document_ref: string | null
  ref_role_document: { id: string; code: string; label: string } | null
  titre: string
  couverture_label: string | null
  workflow_statut: string
  statut: string
  metadonnees: Record<string, unknown> | null
  created_at: string
  updated_at: string
  ref_exemplaires: Array<{
    cote_locale: string | null
    note: string | null
    localisation_interne: string | null
    ref_acces_numeriques: Array<{ url_base: string | null }>
    citations: Array<{ target_type: string; locating: LocatingJson | null }>
  }>
}

export type CorpusDBRow = {
  id: string
  nom: string
  description: string | null
  type: string
  created_by: string | null
  created_at: string
  updated_at: string
  corpus_unites: Array<{ unite_documentaire_id: string }>
}

// ── Fetch sources (top-level UDs avec exemplaires) ────────────

export async function fetchSources() {
  const { data, error } = await supabaseRebond
    .from('v_sources')
    .select('*')
    .is('parent_ud_id', null)
    .order('couverture_sort_start', { ascending: true, nullsFirst: false })
    .order('nom', { ascending: true })
  return { data: data as VSourceRow[] | null, error }
}

// ── Fetch documents enfants (parent_ud_id IS NOT NULL) ────────

export async function fetchDocuments() {
  const { data, error } = await supabaseRebond
    .from('unites_documentaires')
    .select(`
      id,
      parent_ud_id,
      type_unite_ref,
      role_document_ref,
      ref_role_document!role_document_ref ( id, code, label ),
      titre,
      couverture_label,
      workflow_statut:statut_document,
      statut:statut_source,
      metadonnees,
      created_at,
      updated_at,
      ref_exemplaires:exemplaires ( cote_locale, note, localisation_interne, ref_acces_numeriques ( url_base ), citations ( target_type, locating ) )
    `)
    .not('parent_ud_id', 'is', null)
    .order('couverture_label', { ascending: true, nullsFirst: false })
    .order('titre', { ascending: true })
    .order('created_at', { ascending: true, foreignTable: 'ref_exemplaires' })
  return { data: data as UDDocRow[] | null, error }
}

// ── Fetch orphelins (référencés à chaud, sans source) ─────────
// UD sans parent_ud_id ET en_attente = "document à rattacher"

export async function fetchOrphans() {
  const { data, error } = await supabaseRebond
    .from('unites_documentaires')
    .select(`
      id,
      parent_ud_id,
      type_unite_ref,
      role_document_ref,
      ref_role_document!role_document_ref ( id, code, label ),
      titre,
      couverture_label,
      workflow_statut:statut_document,
      statut:statut_source,
      metadonnees,
      created_at,
      updated_at,
      ref_exemplaires:exemplaires ( cote_locale, note, localisation_interne, ref_acces_numeriques ( url_base ), citations ( target_type, locating ) )
    `)
    .is('parent_ud_id', null)
    .eq('statut_document', 'en_attente')
    .order('created_at', { ascending: false })
    .order('created_at', { ascending: true, foreignTable: 'ref_exemplaires' })
  return { data: data as UDDocRow[] | null, error }
}

// ── Fetch corpus ──────────────────────────────────────────────

export async function fetchCorpus() {
  const { data, error } = await supabaseRebond
    .from('corpus')
    .select(`
      id,
      nom,
      description,
      type,
      created_by,
      created_at,
      updated_at,
      corpus_unites ( unite_documentaire_id )
    `)
    .order('created_at', { ascending: false })
  return { data: data as CorpusDBRow[] | null, error }
}

// ── Qualifier une source (step 2 de P1.1) ────────────────────
// Passe statut → 'actif'. Producteur non géré ici (FK complexe).

export async function qualifierSource(id: string, payload: {
  niveau_fiabilite: string | null
  role_document_ref: string | null
  couverture_label: string | null
  metadonnees: Record<string, unknown> | null
}) {
  const { error } = await supabaseRebond
    .from('unites_documentaires')
    .update({
      niveau_fiabilite: payload.niveau_fiabilite || null,
      role_document_ref: payload.role_document_ref || null,
      couverture_label: payload.couverture_label || null,
      statut_source: 'actif',
      metadonnees: payload.metadonnees,
    })
    .eq('id', id)
  return { error }
}

// ── Décrire un document (step 2 de P1.2) ─────────────────────
// Description externe uniquement (forme, langue, période) —
// pas de lecture du contenu, ça c'est le rôle de l'atelier de transcription.
// Le producteur n'est volontairement pas ici : il se déduit/complète après transcription.
// La description physique n'est pas ici : elle vit sur l'exemplaire (ref_exemplaires.description),
// pas sur l'unité documentaire — deux exemplaires du même document peuvent avoir des états différents.
// Passe workflow_statut → 'decrit'.

export async function decrireDocument(id: string, payload: {
  type_unite_ref: string | null
  role_document_ref: string | null
  langue_ref: string | null
  couverture_label: string | null
  identifiant_interne: string | null
  niveau_fiabilite: string | null
  metadonnees: Record<string, unknown> | null
}) {
  const { error } = await supabaseRebond
    .from('unites_documentaires')
    .update({
      type_unite_ref: payload.type_unite_ref || null,
      role_document_ref: payload.role_document_ref || null,
      langue_ref: payload.langue_ref || null,
      couverture_label: payload.couverture_label || null,
      identifiant_interne: payload.identifiant_interne || null,
      niveau_fiabilite: payload.niveau_fiabilite || null,
      statut_document: 'decrit',
      metadonnees: payload.metadonnees,
    })
    .eq('id', id)
  return { error }
}

export async function fetchRoleDocumentOptions(): Promise<Array<{ id: string; code: string; label: string }>> {
  const { data, error } = await supabaseRebond.from('ref_role_document').select('id, code, label').order('label')
  if (error) console.error('[fetchRoleDocumentOptions] error:', error.message)
  return data ?? []
}

// ── Rattacher un document à une source (step 3 de P1.2) ──────
// Définit parent_ud_id → le doc passe de "à rattacher" à "à décrire".

export async function rattacherDocument(id: string, parentUdId: string) {
  const { error } = await supabaseRebond
    .from('unites_documentaires')
    .update({ parent_ud_id: parentUdId })
    .eq('id', id)
  return { error }
}

// ── Fetch citations avec données exemplaires (onglet Exemplaires) ─────────────

export type CitationExemplaireRow = {
  citation_id: string
  target_type: string
  target_id: string
  exemplaire_id: string | null
  is_missing: boolean | null
  lacune: boolean | null
  lacune_note: string | null
  locating: LocatingJson | null
  marginalia: MarginaliaJson | null
  note: string | null
  unite_titre: string | null
  cote_locale: string | null
  depot_nom: string | null
  institution_nom: string | null
  institution_sigle: string | null
  url_base: string | null
}

export async function fetchCitationsWithExemplaires(): Promise<{ data: CitationExemplaireRow[]; error: any }> {
  const { data: citations, error } = await supabaseRebond
    .from('citations')
    .select('id, target_type, target_id, exemplaire_id, is_missing, lacune, lacune_note, locating, marginalia, note')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error || !citations?.length) return { data: [], error }

  const exemplaire_ids = [
    ...new Set(citations.filter(c => c.exemplaire_id).map(c => c.exemplaire_id as string)),
  ]

  const exemplaireMap = new Map<string, any>()
  if (exemplaire_ids.length) {
    const { data: exRows } = await supabaseRebond
      .from('v_exemplaires_pick')
      .select('exemplaire_id, unite_titre, cote_locale, depot_nom, institution_nom, institution_sigle, url_base')
      .in('exemplaire_id', exemplaire_ids)
    for (const ex of exRows ?? []) exemplaireMap.set(ex.exemplaire_id, ex)
  }

  const data: CitationExemplaireRow[] = citations.map(c => {
    const ex = c.exemplaire_id ? exemplaireMap.get(c.exemplaire_id) : null
    return {
      citation_id: c.id,
      target_type: c.target_type,
      target_id: c.target_id,
      exemplaire_id: c.exemplaire_id,
      is_missing: c.is_missing,
      lacune: c.lacune,
      lacune_note: c.lacune_note,
      locating: c.locating,
      marginalia: c.marginalia,
      note: c.note,
      unite_titre: ex?.unite_titre ?? null,
      cote_locale: ex?.cote_locale ?? null,
      depot_nom: ex?.depot_nom ?? null,
      institution_nom: ex?.institution_nom ?? null,
      institution_sigle: ex?.institution_sigle ?? null,
      url_base: ex?.url_base ?? null,
    }
  })

  return { data, error: null }
}

// ── Insertion rapide d'un document (dialog "Référencer") ──────
// Pas d'exemplaire créé : cote/note stockés dans metadonnees.
// Le user complètera depuis l'onglet "En attente".

export async function insertDocumentUD(payload: {
  titre: string
  serie_ref?: string
  parent_ud_id: string | null
  couverture_label?: string | null
  cote?: string | null
  note?: string | null
}) {
  const meta: Record<string, string> = {}
  if (payload.cote?.trim()) meta.cote = payload.cote.trim()
  if (payload.note?.trim()) meta.note = payload.note.trim()

  const { data, error } = await supabaseRebond
    .from('unites_documentaires')
    .insert({
      titre: payload.titre.trim() || 'Document sans titre',
      serie_ref: payload.serie_ref,
      parent_ud_id: payload.parent_ud_id ?? null,
      statut_document: 'en_attente',
      statut_source: 'a_qualifier',
      couverture_label: payload.couverture_label?.trim() || null,
      metadonnees: Object.keys(meta).length ? meta : null,
    })
    .select('id, titre, parent_ud_id, workflow_statut:statut_document, statut:statut_source, metadonnees, created_at, updated_at')
    .single()

  return { data, error }
}
