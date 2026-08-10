// extraction.service.ts — accès données pour le module Extraction.
//
// Le frontend n'appelle jamais Claude directement : il envoie le texte brut
// à la fonction Edge `extract-assertions` (clé Anthropic côté serveur
// uniquement), puis persiste lui-même le résultat validé — même logique que
// le reste de l'app (RLS ouverte, écritures faites depuis le client).

import { supabase, supabaseRebond } from '@/lib/supabase'
import type { AssertionOrigin, AssertionStatus, EntityType, ExtractableExemplaire, ExtractionAssertion, ExtractionEntity, Predicate } from './extraction.types'

// Formulation en français d'une assertion — partagée entre ExtractionPage.tsx
// (affichage par acte) et le module Entités (agrégation cross-documents) :
// un seul switch de prédicats à maintenir, pas deux copies qui divergent.
export function entityLabel(id: string | null, entities: ExtractionEntity[]): string | null {
  if (!id) return null
  return entities.find(e => e.id === id)?.label ?? null
}

export function describeAssertion(a: ExtractionAssertion, entities: ExtractionEntity[]): string {
  const subject = entityLabel(a.subjectEntityId, entities) ?? '?'
  const objectLabel = entityLabel(a.objectEntityId, entities)
  const value = a.valueText ?? (a.valueNumber != null ? String(a.valueNumber) : null) ?? a.valueDate ?? null

  if (a.predicateCode === 'other') {
    const rel = a.rawRelation || a.predicateLabel
    return objectLabel ? `${subject} — ${rel} — ${objectLabel}` : `${subject} — ${rel}${value ? ` : ${value}` : ''}`
  }

  // Prédicats de lieu : l'objet peut être un texte libre (value) OU une
  // entité `place` déjà résolue (objectLabel) — sans ce repli, une
  // assertion résolue vers une entité (value vide) affichait "domicilié à
  // null" (bug réel observé, value valant JS null interpolé en texte).
  switch (a.predicateCode) {
    case 'birth_date': return `${subject} est né(e) le ${value}`
    case 'birth_place': return `${subject} est né(e) à ${objectLabel ?? value}`
    case 'death_date': return `${subject} est décédé(e) le ${value}`
    case 'death_place': return `${subject} est décédé(e) à ${objectLabel ?? value}`
    case 'death': return `${subject} est décédé(e)`
    case 'age': return `${subject} est âgé(e) de ${value} ans`
    case 'occupation': return `${subject} est ${value}`
    case 'residence': return `${subject} réside à ${objectLabel ?? value}`
    case 'domicile': return `${subject} est domicilié(e) à ${objectLabel ?? value}`
    case 'nationality': return `${subject} est de nationalité ${value}`
    case 'father': return `Le père de ${subject} est ${objectLabel ?? value}`
    case 'mother': return `La mère de ${subject} est ${objectLabel ?? value}`
    case 'spouse': return `${subject} est l'époux ou l'épouse de ${objectLabel ?? value}`
    case 'child': return `${subject} est l'enfant de ${objectLabel ?? value}`
    case 'sibling': return `${subject} est frère/sœur de ${objectLabel ?? value}`
    case 'witness': return `${subject} est témoin${objectLabel ? ` de ${objectLabel}` : ''}`
    case 'neighbor': return `${subject} est voisin(e)${objectLabel ? ` de ${objectLabel}` : ''}`
    case 'sex': return `${subject} est de sexe ${value}`
    case 'name': return `${subject} se nomme ${value}`
    case 'signs': return `${subject} sait signer`
    case 'cannot_sign': return `${subject} ne sait pas signer`
    case 'present': return `${subject} est présent(e)`
    case 'absent': return `${subject} est absent(e)`
    case 'marital_status': return `${subject} a pour statut matrimonial : ${value}`
    case 'widowhood': return `${subject} est veuf/veuve${objectLabel ? ` de ${objectLabel}` : ''}`
    case 'title': return `${subject} est qualifié(e) de ${value}`
    case 'quality': return `${subject} est ${value}`
    case 'function': return `${subject} est ${value}`
    case 'officer_role': return `${subject} exerce les fonctions de ${value}`
    case 'birth': return `${subject} est né(e)`
    case 'birth_time': return `${subject} est né(e) à ${value}`
    case 'death_time': return `${subject} est décédé(e) à ${value}`
    case 'marriage_time': return `${subject} se marie à ${value}`
    case 'comparant': return `${subject} comparaît`
    case 'declarant': return `${subject} est le/la déclarant(e)`
    case 'declares': return `${subject} déclare ${value}`
    case 'presentation': return `${subject} présente ${objectLabel ?? value}`
    case 'naming_declaration': return objectLabel
      ? `${subject} déclare vouloir donner à ${objectLabel} les prénoms ${value}`
      : `${subject} déclare vouloir donner les prénoms ${value}`
    // reading a toujours pour sujet l'entité document (jamais une
    // personne, cf. index.ts de la fonction Edge "L'entité document") —
    // la formulation reste donc centrée sur le document, pas sur un
    // destinataire.
    case 'reading': return `${subject} a fait l'objet d'une lecture`
    case 'is_asked_to_sign': return `${subject} est interpellé(e) de signer`
    case 'consent': return `${subject} donne son consentement`
    case 'opposition': return `${subject} fait opposition`
    case 'publication': return `${subject} — publication de mariage : ${value}`
    case 'document_presented': return `${subject} présente un document : ${value}`
    case 'recognition': return `${subject} fait une reconnaissance${objectLabel ? ` de ${objectLabel}` : ''}`
    case 'act_date': return `${subject} est daté(e) du ${value}`
    case 'act_place': return `${subject} concerne la commune de ${objectLabel ?? value}`
    case 'act_time': return `${subject} est établi(e) à ${value}`
    case 'document_type': return `${subject} est de type ${value}`
    case 'section': return `${subject} — section : ${value}`
    case 'hamlet': return `${subject} — hameau : ${value}`
    case 'administrative_area': return `${subject} — circonscription : ${objectLabel ?? value}`
    case 'actor': return `${objectLabel ?? value} accomplit — ${subject}`
    case 'before_person': return `${subject} — devant : ${objectLabel ?? value}`
    case 'presented_person': return `${subject} — personne présentée : ${objectLabel ?? value}`
    case 'present_at': return `${subject} est présent(e) lors de ${objectLabel ?? value}`
    default:
      return objectLabel
        ? `${subject} — ${a.predicateLabel} — ${objectLabel}`
        : `${subject} — ${a.predicateLabel}${value ? ` : ${value}` : ''}`
  }
}

// Hub d'extraction : uniquement les exemplaires dont la transcription est
// marquée "transcrit" (statut = 'termine', posé via le bouton "Marquer comme
// transcrit" de l'atelier — cf. markAsTranscrit() dans atelier.service.ts),
// ET qui ont au moins une version enregistrée, avec leur version la plus
// récente. Une transcription en cours n'a pas sa place ici : le contenu
// n'est pas encore stabilisé, l'extraction serait prématurée. Plusieurs
// requêtes batchées (pas de N+1 par ligne) plutôt qu'un gros embed
// multi-niveaux, pour rester lisible.
export async function fetchExtractableExemplaires(): Promise<ExtractableExemplaire[]> {
  const { data: versions, error: vErr } = await supabaseRebond.from('transcription_versions')
    .select('id, transcription_id, version, created_at')
    .order('version', { ascending: false })
  if (vErr) throw vErr
  if (!versions?.length) return []

  const latestByTranscription = new Map<string, { id: string; version: number; createdAt: string }>()
  for (const v of versions) {
    if (!latestByTranscription.has(v.transcription_id)) {
      latestByTranscription.set(v.transcription_id, { id: v.id, version: v.version, createdAt: v.created_at })
    }
  }

  const transcriptionIds = [...latestByTranscription.keys()]
  const { data: transcriptions, error: trErr } = await supabaseRebond.from('transcriptions')
    .select('id, exemplaire_id, statut')
    .eq('statut', 'termine')
    .in('id', transcriptionIds)
  if (trErr) throw trErr
  const exemplaireIdByTranscription = new Map((transcriptions ?? []).map(t => [t.id, t.exemplaire_id]))
  for (const id of latestByTranscription.keys()) {
    if (!exemplaireIdByTranscription.has(id)) latestByTranscription.delete(id)
  }

  const exemplaireIds = [...new Set(exemplaireIdByTranscription.values())]
  if (exemplaireIds.length === 0) return []

  const { data: exemplaires, error: exErr } = await supabaseRebond.from('exemplaires')
    .select('id, cote_locale, unite_documentaire_id')
    .in('id', exemplaireIds)
  if (exErr) throw exErr
  const exemplaireById = new Map((exemplaires ?? []).map(e => [e.id, e]))

  const documentIds = [...new Set((exemplaires ?? []).map(e => e.unite_documentaire_id))]
  const { data: docs, error: docErr } = await supabaseRebond.from('unites_documentaires')
    .select('id, titre, parent_ud_id, ref_role_document!role_document_ref ( code )')
    .in('id', documentIds)
  if (docErr) throw docErr
  // Seuls les documents de rôle "acte primaire" (ACTE_PRIMAIRE) sont
  // extraits ici — les instruments de recherche, registres compilés, etc.
  // ne sont pas des actes à décomposer en assertions atomiques.
  const primaryActeDocs = (docs ?? []).filter(d => {
    const role = Array.isArray(d.ref_role_document) ? d.ref_role_document[0] : d.ref_role_document
    return role?.code === 'ACTE_PRIMAIRE'
  })
  const docById = new Map(primaryActeDocs.map(d => [d.id, d]))

  const parentIds = [...new Set((docs ?? []).map(d => d.parent_ud_id).filter((id): id is string => !!id))]
  const { data: parents } = parentIds.length
    ? await supabaseRebond.from('unites_documentaires').select('id, titre').in('id', parentIds)
    : { data: [] as Array<{ id: string; titre: string }> }
  const parentTitreById = new Map((parents ?? []).map(p => [p.id, p.titre]))

  const versionIds = [...latestByTranscription.values()].map(v => v.id)
  const { data: assertions } = await supabaseRebond.from('transcription_assertions')
    .select('transcription_version_id, status')
    .in('transcription_version_id', versionIds)
  const countsByVersion = new Map<string, { total: number; pending: number }>()
  for (const a of assertions ?? []) {
    const c = countsByVersion.get(a.transcription_version_id) ?? { total: 0, pending: 0 }
    c.total++
    if (a.status === 'pending') c.pending++
    countsByVersion.set(a.transcription_version_id, c)
  }

  const result: ExtractableExemplaire[] = []
  for (const [transcriptionId, latest] of latestByTranscription) {
    const exemplaireId = exemplaireIdByTranscription.get(transcriptionId)
    if (!exemplaireId) continue
    const ex = exemplaireById.get(exemplaireId)
    if (!ex) continue
    const doc = docById.get(ex.unite_documentaire_id)
    if (!doc) continue
    const counts = countsByVersion.get(latest.id) ?? { total: 0, pending: 0 }
    result.push({
      exemplaireId,
      documentId: ex.unite_documentaire_id,
      documentTitre: doc?.titre ?? 'Document',
      registreName: doc?.parent_ud_id ? (parentTitreById.get(doc.parent_ud_id) ?? null) : null,
      coteLocale: ex.cote_locale ?? null,
      latestVersionId: latest.id,
      latestVersionNumber: latest.version,
      latestVersionCreatedAt: latest.createdAt,
      assertionsCount: counts.total,
      pendingCount: counts.pending,
    })
  }

  result.sort((a, b) => new Date(b.latestVersionCreatedAt).getTime() - new Date(a.latestVersionCreatedAt).getTime())
  return result
}

export async function fetchVersion(versionId: string): Promise<{ id: string; version: number; contenu: unknown; createdAt: string } | null> {
  const { data, error } = await supabaseRebond.from('transcription_versions')
    .select('id, version, contenu, created_at')
    .eq('id', versionId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id, version: data.version, contenu: data.contenu, createdAt: data.created_at }
}

export async function fetchPredicates(): Promise<Predicate[]> {
  const { data, error } = await supabaseRebond.from('ref_assertion_predicates')
    .select('id, code, label')
    .order('ordre', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchEntities(transcriptionVersionId: string): Promise<ExtractionEntity[]> {
  const { data, error } = await supabaseRebond.from('transcription_entities')
    .select('id, local_key, label, entity_type')
    .eq('transcription_version_id', transcriptionVersionId)
    .order('local_key', { ascending: true })
  if (error) throw error
  return (data ?? []).map(e => ({
    id: e.id,
    localKey: e.local_key,
    label: e.label,
    entityType: (
      e.entity_type === 'document' || e.entity_type === 'place' || e.entity_type === 'event'
        ? e.entity_type
        : 'person'
    ),
  }))
}

export async function fetchAssertions(transcriptionVersionId: string): Promise<ExtractionAssertion[]> {
  const { data, error } = await supabaseRebond.from('transcription_assertions')
    .select(`
      id, subject_entity_id, predicate_id, raw_relation, object_entity_id,
      value_text, value_number, value_date, source_text, source_start, source_end,
      status, origin, created_at,
      ref_assertion_predicates ( code, label )
    `)
    .eq('transcription_version_id', transcriptionVersionId)
    .order('source_start', { ascending: true, nullsFirst: false })
  if (error) throw error

  return (data ?? []).map((a: any) => {
    const pred = Array.isArray(a.ref_assertion_predicates) ? a.ref_assertion_predicates[0] : a.ref_assertion_predicates
    return {
      id: a.id,
      subjectEntityId: a.subject_entity_id,
      predicateId: a.predicate_id,
      predicateCode: pred?.code ?? 'other',
      predicateLabel: pred?.label ?? 'Autre',
      rawRelation: a.raw_relation,
      objectEntityId: a.object_entity_id,
      valueText: a.value_text,
      valueNumber: a.value_number,
      valueDate: a.value_date,
      sourceText: a.source_text,
      sourceStart: a.source_start,
      sourceEnd: a.source_end,
      status: a.status as AssertionStatus,
      origin: (a.origin === 'manual' ? 'manual' : 'ai') as AssertionOrigin,
      createdAt: a.created_at,
    }
  })
}

export async function setAssertionStatus(id: string, status: AssertionStatus) {
  const { error } = await supabaseRebond.from('transcription_assertions').update({ status }).eq('id', id)
  if (error) throw error
}

// Champs qu'un humain peut corriger/saisir à la main — pas value_number/
// value_date (normalisation réservée à l'IA, une saisie manuelle passe
// toujours par value_text, plus simple) ni source_start/source_end (pas de
// surlignage pour un fait sans citation localisée précisément).
export type ManualAssertionInput = {
  subjectEntityId: string
  predicateCode: string
  rawRelation?: string | null
  objectEntityId?: string | null
  valueText?: string | null
  sourceText?: string | null
}

// Une entité créée à la volée pour porter une assertion manuelle que
// l'extraction n'avait pas identifiée du tout (ni la personne/le lieu, ni
// le fait). local_key préfixé "M" pour rester visuellement distinct des
// clés générées par l'IA (P1, L2...) — purement cosmétique, aucune logique
// n'en dépend.
export async function createManualEntity(transcriptionVersionId: string, label: string, entityType: EntityType): Promise<ExtractionEntity> {
  const { data: existing } = await supabaseRebond.from('transcription_entities')
    .select('local_key')
    .eq('transcription_version_id', transcriptionVersionId)
    .like('local_key', 'M%')
  const usedNumbers = (existing ?? []).map(e => parseInt(e.local_key.slice(1), 10)).filter(n => !Number.isNaN(n))
  const nextNumber = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1

  const { data, error } = await supabaseRebond.from('transcription_entities')
    .insert({
      transcription_version_id: transcriptionVersionId,
      local_key: `M${nextNumber}`,
      label,
      entity_type: entityType,
    })
    .select('id, local_key, label, entity_type')
    .single()
  if (error) throw error
  return { id: data.id, localKey: data.local_key, label: data.label, entityType: data.entity_type as EntityType }
}

async function resolvePredicateId(predicateCode: string): Promise<string> {
  const { data, error } = await supabaseRebond.from('ref_assertion_predicates')
    .select('id')
    .eq('code', predicateCode)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`Prédicat inconnu : ${predicateCode}`)
  return data.id
}

// Ajout manuel : un fait que l'extraction n'a pas trouvé. origin='manual' +
// status='validated' d'emblée — c'est un humain qui vient de l'écrire, pas
// une proposition à revalider.
export async function createManualAssertion(transcriptionVersionId: string, input: ManualAssertionInput): Promise<void> {
  const predicateId = await resolvePredicateId(input.predicateCode)
  const { error } = await supabaseRebond.from('transcription_assertions').insert({
    transcription_version_id: transcriptionVersionId,
    subject_entity_id: input.subjectEntityId,
    predicate_id: predicateId,
    raw_relation: input.rawRelation ?? null,
    object_entity_id: input.objectEntityId ?? null,
    value_text: input.valueText ?? null,
    source_text: input.sourceText ?? null,
    status: 'validated',
    origin: 'manual',
  })
  if (error) throw error
}

// Édition : une assertion générée par l'IA ne convient pas telle quelle —
// une fois corrigée, son contenu n'est plus "ce que l'IA a dit" mais "ce
// que l'humain a écrit" : origin bascule sur 'manual' et status sur
// 'validated' (éditer, c'est déjà valider ce qu'on vient d'écrire).
export async function updateAssertion(id: string, input: ManualAssertionInput): Promise<void> {
  const predicateId = await resolvePredicateId(input.predicateCode)
  const { error } = await supabaseRebond.from('transcription_assertions').update({
    predicate_id: predicateId,
    raw_relation: input.rawRelation ?? null,
    object_entity_id: input.objectEntityId ?? null,
    value_text: input.valueText ?? null,
    source_text: input.sourceText ?? null,
    status: 'validated',
    origin: 'manual',
  }).eq('id', id)
  if (error) throw error
}

type EdgeEntity = { local_key: string; label: string; entity_type?: 'person' | 'document' | 'place' | 'event' }
type EdgeAssertion = {
  subject: string
  predicate: string
  raw_relation?: string | null
  object?: string | null
  value_text?: string | null
  value_number?: number | null
  value_date?: string | null
  source_text: string
  source_start?: number | null
  source_end?: number | null
}
type EdgeResponse = { entities: EdgeEntity[]; assertions: EdgeAssertion[] }

// Garde-fou de cohérence ontologique : certains termes ne sont jamais une
// profession (occupation) même quand le modèle les classe ainsi — ce sont
// des statuts (quality). Corrige plutôt que de rejeter la donnée. Liste à
// enrichir au fil des actes observés, volontairement pas exhaustive dès le
// départ (cf. schema-docs/transcription_assertions.md, doctrine "ne pas
// figer le référentiel").
const QUALITY_NOT_OCCUPATION_TERMS = new Set(['propriétaire', 'proprietaire', 'rentier', 'rentière', 'rentiere'])

function normalizePredicateCode(predicateCode: string, valueText: string | null | undefined): string {
  if (predicateCode === 'occupation' && valueText && QUALITY_NOT_OCCUPATION_TERMS.has(valueText.trim().toLowerCase())) {
    return 'quality'
  }
  return predicateCode
}

// Prédicats dépréciés (cf. migrations 20260806100115/118) : les lignes
// existent encore en base (FK RESTRICT sur d'anciennes assertions), donc
// predicateIdByCode les contient toujours — sans cette liste, un code
// déprécié que Claude produirait malgré le prompt serait accepté tel quel
// au lieu d'être routé vers "other". Appliqué explicitement, pas seulement
// laissé au prompt (demandé par l'utilisateur : "faire respecter
// automatiquement les prédicats dépréciés").
export const DEPRECATED_PREDICATE_CODES = new Set(['time', 'section', 'hamlet'])

// Garde-fou : "witness" ne doit être accepté que si la preuve elle-même
// contient un marqueur documentaire de témoignage. Observé sur un acte réel :
// Claude a produit "witness" pour une personne dont le source_text établissait
// en fait un lien familial (épouse/mère), pas une présence en tant que témoin.
// Reclassé en "other" (raw_relation conservé) plutôt que supprimé, pour rester
// visible et validable à la main plutôt que de disparaître silencieusement.
const WITNESS_EVIDENCE_MARKERS = ['témoin', 'témoins', 'en présence de', 'en présence des']

function hasWitnessEvidence(sourceText: string): boolean {
  const lower = sourceText.toLowerCase()
  return WITNESS_EVIDENCE_MARKERS.some(marker => lower.includes(marker))
}

// Ré-extraction complète pour cette version : repart de zéro (pas de fusion
// incrémentale au MVP, cf. schema-docs/transcription_assertions.md). Efface
// donc aussi les validations déjà faites sur cette version — l'appelant
// (UI) doit confirmer avant d'appeler ceci si des assertions existent déjà.
export async function runExtraction(transcriptionVersionId: string, text: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<EdgeResponse>('extract-assertions', {
    body: { text },
  })
  if (error) throw error
  if (!data) throw new Error("Réponse vide de la fonction d'extraction")

  await supabaseRebond.from('transcription_assertions').delete().eq('transcription_version_id', transcriptionVersionId)
  await supabaseRebond.from('transcription_entities').delete().eq('transcription_version_id', transcriptionVersionId)

  if (data.entities.length === 0) return

  const { data: insertedEntities, error: entErr } = await supabaseRebond.from('transcription_entities')
    .insert(data.entities.map(e => ({
      transcription_version_id: transcriptionVersionId,
      local_key: e.local_key,
      label: e.label,
      entity_type:
        e.entity_type === 'document' || e.entity_type === 'place' || e.entity_type === 'event'
          ? e.entity_type
          : 'person',
    })))
    .select('id, local_key')
  if (entErr) throw entErr

  const entityIdByKey = new Map((insertedEntities ?? []).map(e => [e.local_key, e.id]))

  const predicates = await fetchPredicates()
  const predicateIdByCode = new Map(predicates.map(p => [p.code, p.id]))
  const otherId = predicateIdByCode.get('other')

  const rows = data.assertions
    .map(a => {
      const subjectId = entityIdByKey.get(a.subject)
      if (!subjectId) return null
      let predicateCode = normalizePredicateCode(a.predicate, a.value_text)
      let forcedRawRelation: string | null = null
      if (predicateCode === 'witness' && !hasWitnessEvidence(a.source_text)) {
        forcedRawRelation = a.raw_relation ?? 'witness (rejeté : aucun marqueur de témoignage dans le texte source)'
        predicateCode = 'other'
      }
      const knownPredicate = predicateIdByCode.has(predicateCode) && !DEPRECATED_PREDICATE_CODES.has(predicateCode)
      const predicateId = knownPredicate ? predicateIdByCode.get(predicateCode)! : otherId
      if (!predicateId) return null
      return {
        transcription_version_id: transcriptionVersionId,
        subject_entity_id: subjectId,
        predicate_id: predicateId,
        // Si Claude a renvoyé un code hors vocabulaire malgré la consigne,
        // on le range dans "other" sans le perdre (visible dans raw_relation).
        raw_relation: forcedRawRelation ?? (knownPredicate ? (a.raw_relation ?? null) : (a.raw_relation ?? a.predicate)),
        object_entity_id: a.object ? (entityIdByKey.get(a.object) ?? null) : null,
        value_text: a.value_text ?? null,
        value_number: a.value_number ?? null,
        value_date: a.value_date ?? null,
        source_text: a.source_text,
        source_start: a.source_start ?? null,
        source_end: a.source_end ?? null,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length === 0) return
  const { error: assErr } = await supabaseRebond.from('transcription_assertions').insert(rows)
  if (assErr) throw assErr
}
