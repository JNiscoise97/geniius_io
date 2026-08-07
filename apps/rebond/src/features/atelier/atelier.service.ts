// atelier.service.ts — accès données pour l'atelier documentaire (transcription).
//
// TODO module (à reprendre) :
// - Revoir le versionning + l'enregistrement (auto-save différée, création
//   de version, ensureTranscriptionRow — cf. bug du brouillon vide corrigé
//   le 2026-08-07, potentiellement d'autres cas limites à couvrir).
// - Ajout d'une section "non transcrite" (marquer un passage comme non
//   transcrit, distinct d'un texte vide).
// - Ajout d'une suite de mots illisibles (marqueur dédié dans l'éditeur,
//   façon [ILLISIBLE...] de l'ancien système mais pensé pour Tiptap).
// - Revoir le chargement de la dernière version à l'ouverture de la page.
// - Revoir le comportement du clic sur "Marquer comme transcrit".

import { supabase, supabaseRebond } from '@/lib/supabase'
import { unpackMarginalia } from '../patrimoine/citationJsonb'
import type {
  AtelierExemplaire, TranscriptionStatut, TranscriptionVersion, TranscriptionCommentaire, CommentaireStatut,
  TranscriptionZoneType, TranscriptionZone, TranscriptionQualite, ZoneAttendu,
} from './atelier.types'

type TranscriptionQualiteRow = {
  source_lecture_kind: string | null
  langue_ref: string | null
  ecriture_ref: string | null
  handwriting_legibility_ref: string | null
  completeness: string
  completeness_note: string | null
  reserve_level: string
  reserve_reason: string | null
}

function toQualite(row: TranscriptionQualiteRow): TranscriptionQualite {
  return {
    sourceLectureKind: row.source_lecture_kind as TranscriptionQualite['sourceLectureKind'],
    langueRef: row.langue_ref,
    ecritureRef: row.ecriture_ref,
    handwritingLegibilityRef: row.handwriting_legibility_ref,
    completeness: row.completeness as TranscriptionQualite['completeness'],
    completenessNote: row.completeness_note,
    reserveLevel: row.reserve_level as TranscriptionQualite['reserveLevel'],
    reserveReason: row.reserve_reason,
  }
}

export async function fetchDocumentHeader(documentId: string) {
  const { data: doc, error } = await supabaseRebond.from('unites_documentaires')
    .select('id, titre, couverture_label, parent_ud_id')
    .eq('id', documentId)
    .maybeSingle<{ id: string; titre: string; couverture_label: string | null; parent_ud_id: string | null }>()
  if (error || !doc) return { data: null, error }

  let registreName: string | null = null
  if (doc.parent_ud_id) {
    const { data: parent } = await supabaseRebond.from('unites_documentaires')
      .select('titre').eq('id', doc.parent_ud_id).maybeSingle<{ titre: string }>()
    registreName = parent?.titre ?? null
  }

  return { data: { ...doc, registreName }, error: null }
}

export async function fetchExemplairesForDocument(documentId: string): Promise<{ data: AtelierExemplaire[]; error: Error | null }> {
  const { data: exRows, error: exErr } = await supabaseRebond.from('exemplaires')
    .select(`
      id, cote_locale, identifiant_interne, localisation_interne, note, est_reference,
      ref_natures ( label ),
      ref_depots ( nom, ref_institutions ( nom, sigle ) )
    `)
    .eq('unite_documentaire_id', documentId)
    .order('created_at', { ascending: true })
  if (exErr) return { data: [], error: exErr }

  const rows = exRows ?? []
  const ids = rows.map((r: any) => r.id as string)

  const transcriptionByExemplaire = new Map<string, { statut: TranscriptionStatut; updated_at: string }>()
  if (ids.length) {
    const { data: trs } = await supabaseRebond.from('transcriptions')
      .select('exemplaire_id, statut, updated_at')
      .in('exemplaire_id', ids)
    for (const t of trs ?? []) {
      transcriptionByExemplaire.set(t.exemplaire_id, { statut: t.statut as TranscriptionStatut, updated_at: t.updated_at })
    }
  }

  const data: AtelierExemplaire[] = rows.map((ex: any) => {
    const nature = Array.isArray(ex.ref_natures) ? ex.ref_natures[0] : ex.ref_natures
    const depot = Array.isArray(ex.ref_depots) ? ex.ref_depots[0] : ex.ref_depots
    const institution = depot ? (Array.isArray(depot.ref_institutions) ? depot.ref_institutions[0] : depot.ref_institutions) : null
    const depotLabel = depot ? [institution?.sigle ?? institution?.nom, depot.nom].filter(Boolean).join(' · ') || null : null
    const transcription = transcriptionByExemplaire.get(ex.id)

    return {
      id: ex.id,
      coteLocale: ex.cote_locale ?? null,
      identifiantInterne: ex.identifiant_interne ?? null,
      localisationInterne: ex.localisation_interne ?? null,
      note: ex.note ?? null,
      natureLabel: nature?.label ?? null,
      depotLabel,
      estReference: ex.est_reference ?? false,
      transcriptionStatut: transcription?.statut ?? 'non_commence',
      transcriptionUpdatedAt: transcription?.updated_at ?? null,
    }
  })

  return { data, error: null }
}

export async function fetchExemplaireContext(exemplaireId: string) {
  return supabaseRebond.from('exemplaires')
    .select(`
      id, cote_locale, unite_documentaire_id,
      unites_documentaires ( id, titre ),
      ref_depots ( nom, ref_institutions ( nom, sigle ) )
    `)
    .eq('id', exemplaireId)
    .maybeSingle()
}

export async function fetchTranscription(exemplaireId: string) {
  const { data, error } = await supabaseRebond.from('transcriptions')
    .select(`
      id, contenu, statut, updated_at,
      source_lecture_kind, langue_ref, ecriture_ref, handwriting_legibility_ref,
      completeness, completeness_note, reserve_level, reserve_reason,
      marque_transcrit_par_email, marque_transcrit_le
    `)
    .eq('exemplaire_id', exemplaireId)
    .maybeSingle<{
      id: string; contenu: unknown; statut: TranscriptionStatut; updated_at: string
      marque_transcrit_par_email: string | null; marque_transcrit_le: string | null
    } & TranscriptionQualiteRow>()
  if (error || !data) return { data, error }
  return { data: { ...data, qualite: toQualite(data) }, error: null }
}

export async function saveTranscription(exemplaireId: string, contenu: unknown, statut: TranscriptionStatut) {
  return supabaseRebond.from('transcriptions')
    .upsert({ exemplaire_id: exemplaireId, contenu, statut }, { onConflict: 'exemplaire_id' })
    .select('id, updated_at')
    .single()
}

// Garantit une ligne rebond.transcriptions pour cet exemplaire (créée vide
// si besoin) — nécessaire avant de créer une version ou un commentaire, qui
// pointent tous les deux vers transcriptions.id, pas exemplaire_id.
export async function ensureTranscriptionId(exemplaireId: string): Promise<string> {
  const { data: existing } = await supabaseRebond.from('transcriptions')
    .select('id').eq('exemplaire_id', exemplaireId).maybeSingle<{ id: string }>()
  if (existing?.id) return existing.id

  const { data, error } = await supabaseRebond.from('transcriptions')
    .insert({ exemplaire_id: exemplaireId, contenu: {}, statut: 'en_cours' })
    .select('id').single<{ id: string }>()
  if (error) throw error
  return data.id
}

// -------------------- Historique de versions --------------------

export async function fetchVersions(transcriptionId: string): Promise<TranscriptionVersion[]> {
  const { data, error } = await supabaseRebond.from('transcription_versions')
    .select('id, version, contenu, change_summary, created_at')
    .eq('transcription_id', transcriptionId)
    .order('version', { ascending: false })
  if (error) throw error
  return (data ?? []).map(v => ({
    id: v.id,
    version: v.version,
    contenu: v.contenu,
    changeSummary: v.change_summary,
    createdAt: v.created_at,
  }))
}

export async function createVersionSnapshot(transcriptionId: string, contenu: unknown, changeSummary: string | null): Promise<TranscriptionVersion> {
  const { data, error } = await supabaseRebond.from('transcription_versions')
    .insert({ transcription_id: transcriptionId, contenu, change_summary: changeSummary })
    .select('id, version, contenu, change_summary, created_at')
    .single()
  if (error) throw error
  return {
    id: data.id,
    version: data.version,
    contenu: data.contenu,
    changeSummary: data.change_summary,
    createdAt: data.created_at,
  }
}

// -------------------- Commentaires ancrés --------------------

export async function fetchComments(transcriptionId: string): Promise<TranscriptionCommentaire[]> {
  const { data, error } = await supabaseRebond.from('transcription_commentaires')
    .select('id, contenu, statut, created_at, resolved_at')
    .eq('transcription_id', transcriptionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(c => ({
    id: c.id,
    contenu: c.contenu,
    statut: c.statut as CommentaireStatut,
    createdAt: c.created_at,
    resolvedAt: c.resolved_at,
  }))
}

export async function createComment(transcriptionId: string, contenu: string): Promise<TranscriptionCommentaire> {
  const { data, error } = await supabaseRebond.from('transcription_commentaires')
    .insert({ transcription_id: transcriptionId, contenu })
    .select('id, contenu, statut, created_at, resolved_at')
    .single()
  if (error) throw error
  return {
    id: data.id,
    contenu: data.contenu,
    statut: data.statut as CommentaireStatut,
    createdAt: data.created_at,
    resolvedAt: data.resolved_at,
  }
}

export async function setCommentStatut(commentId: string, statut: CommentaireStatut) {
  const { error } = await supabaseRebond.from('transcription_commentaires')
    .update({ statut, resolved_at: statut === 'resolu' ? new Date().toISOString() : null })
    .eq('id', commentId)
  if (error) throw error
}

export async function deleteComment(commentId: string) {
  const { error } = await supabaseRebond.from('transcription_commentaires').delete().eq('id', commentId)
  if (error) throw error
}

// -------------------- Zones spécifiques --------------------

export async function fetchZoneTypes(): Promise<TranscriptionZoneType[]> {
  const { data, error } = await supabaseRebond.from('ref_transcription_zone_types')
    .select('id, code, label')
    .order('ordre', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchZones(transcriptionId: string): Promise<TranscriptionZone[]> {
  const { data, error } = await supabaseRebond.from('transcription_zones')
    .select('id, zone_type_id, contenu, created_at')
    .eq('transcription_id', transcriptionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(z => ({
    id: z.id,
    zoneTypeId: z.zone_type_id,
    contenu: z.contenu,
    createdAt: z.created_at,
  }))
}

export async function createZone(transcriptionId: string, zoneTypeId: string, contenu: string): Promise<TranscriptionZone> {
  const { data, error } = await supabaseRebond.from('transcription_zones')
    .insert({ transcription_id: transcriptionId, zone_type_id: zoneTypeId, contenu })
    .select('id, zone_type_id, contenu, created_at')
    .single()
  if (error) throw error
  return { id: data.id, zoneTypeId: data.zone_type_id, contenu: data.contenu, createdAt: data.created_at }
}

export async function updateZone(zoneId: string, contenu: string) {
  const { error } = await supabaseRebond.from('transcription_zones').update({ contenu }).eq('id', zoneId)
  if (error) throw error
}

export async function deleteZone(zoneId: string) {
  const { error } = await supabaseRebond.from('transcription_zones').delete().eq('id', zoneId)
  if (error) throw error
}

// Ce qui est "attendu" par zone (mention marginale / signature / rature),
// tel que décrit dans Patrimoine documentaire (citations.marginalia, étape
// "Décrire") — complémentaire, pas dupliqué, au contenu relevé ici. Clé =
// code de rebond.ref_transcription_zone_types (mention_marginale, signature,
// rature_marginale), pas son id, pour rester indépendant des uuid générés.
export async function fetchZonesAttendu(exemplaireId: string): Promise<Record<string, ZoneAttendu>> {
  const { data: cit } = await supabaseRebond.from('citations')
    .select('marginalia')
    .eq('exemplaire_id', exemplaireId)
    .in('target_type', ['ec_acte', 'ec_table'])
    .maybeSingle<{ marginalia: unknown }>()

  const mar = unpackMarginalia((cit?.marginalia as any) ?? null)
  return {
    mention_marginale: { present: mar.marginal_mentions_present, count: mar.marginal_mentions_count },
    signature: { present: mar.signatures_present, count: mar.signatures_count },
    rature_marginale: { present: mar.marginal_crossouts_present, count: mar.marginal_crossouts_count },
  }
}

// -------------------- Qualité de la transcription --------------------

export async function updateQualite(transcriptionId: string, patch: Partial<TranscriptionQualite>) {
  const dbPatch: Partial<TranscriptionQualiteRow> = {}
  if ('sourceLectureKind' in patch) dbPatch.source_lecture_kind = patch.sourceLectureKind ?? null
  if ('langueRef' in patch) dbPatch.langue_ref = patch.langueRef ?? null
  if ('ecritureRef' in patch) dbPatch.ecriture_ref = patch.ecritureRef ?? null
  if ('handwritingLegibilityRef' in patch) dbPatch.handwriting_legibility_ref = patch.handwritingLegibilityRef ?? null
  if ('completeness' in patch) dbPatch.completeness = patch.completeness
  if ('completenessNote' in patch) dbPatch.completeness_note = patch.completenessNote ?? null
  if ('reserveLevel' in patch) dbPatch.reserve_level = patch.reserveLevel
  if ('reserveReason' in patch) dbPatch.reserve_reason = patch.reserveReason ?? null

  const { error } = await supabaseRebond.from('transcriptions').update(dbPatch).eq('id', transcriptionId)
  if (error) throw error
}

// -------------------- Marquer comme transcrit --------------------

// Historise qui a marqué la transcription comme terminée (pas un
// historique multi-entrées — juste la dernière personne, cf.
// schema-docs/transcriptions.md). Utilise le client `supabase` (session
// active), pas `supabaseRebond` (anon, sans session), pour connaître
// l'utilisateur courant.
export async function markAsTranscrit(transcriptionId: string): Promise<{ email: string | null; le: string }> {
  const { data: userData } = await supabase.auth.getUser()
  const email = userData.user?.email ?? null
  const userId = userData.user?.id ?? null
  const le = new Date().toISOString()

  const { error } = await supabaseRebond.from('transcriptions').update({
    statut: 'termine',
    marque_transcrit_par: userId,
    marque_transcrit_par_email: email,
    marque_transcrit_le: le,
  }).eq('id', transcriptionId)
  if (error) throw error

  return { email, le }
}

// Rouvre l'édition — ne touche pas marque_transcrit_par/_email/_le, qui
// reste la trace de la dernière marque "transcrit" même après réouverture.
export async function revertToEnCours(transcriptionId: string) {
  const { error } = await supabaseRebond.from('transcriptions').update({ statut: 'en_cours' }).eq('id', transcriptionId)
  if (error) throw error
}
