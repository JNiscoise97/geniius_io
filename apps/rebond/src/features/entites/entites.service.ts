// entites.service.ts — accès données pour le module Entités (registre
// canonique cross-documents). Voir supabase/schema-docs/entities.md pour la
// doctrine complète (pourquoi ce registre est distinct de
// transcription_entities, pourquoi la promotion est automatique).

import { supabaseRebond } from '@/lib/supabase'
import { describeAssertion, entityLabel as extractionEntityLabel } from '../extraction/extraction.service'
import type { ExtractionAssertion, ExtractionEntity } from '../extraction/extraction.types'
import type { CanonicalEntity, EntityDetail, EntityFact, EntityListItem, EntityRelation, EntityType } from './entites.types'

// Prédicats relationnels (personne -> personne) affichés à part comme
// "relations directes" sur la fiche, plutôt que noyés dans la liste de
// faits — cf. doctrine posée avec l'utilisateur : la fiche reste une liste
// plate, pas un graphe (ça, c'est le rôle du futur module Graphe historique).
const RELATION_PREDICATES = new Set(['father', 'mother', 'spouse', 'child', 'sibling', 'relative', 'neighbor', 'friend'])

// Promotion automatique : appelée quand une assertion passe à "validated"
// (voir ExtractionPage.tsx, handleSetStatus) avec les local_key ids
// (subject + object) de cette assertion. Idempotent — ne crée une entité
// canonique que si cette entité locale n'en a pas déjà une. Seuls
// entity_type "person"/"place" sont promus ("document" reste dans
// Patrimoine, "event" reste local à l'acte — n'a pas de sens à rapprocher
// d'un acte à l'autre).
export async function ensureEntitiesPromoted(transcriptionEntityIds: Array<string | null | undefined>): Promise<void> {
  const ids = [...new Set(transcriptionEntityIds.filter((id): id is string => !!id))]
  if (ids.length === 0) return

  const { data: localEntities, error: leErr } = await supabaseRebond.from('transcription_entities')
    .select('id, label, entity_type')
    .in('id', ids)
  if (leErr) throw leErr

  const promotable = (localEntities ?? []).filter(e => e.entity_type === 'person' || e.entity_type === 'place')
  if (promotable.length === 0) return

  const { data: existingLinks, error: linkErr } = await supabaseRebond.from('entity_links')
    .select('transcription_entity_id')
    .in('transcription_entity_id', promotable.map(e => e.id))
  if (linkErr) throw linkErr
  const alreadyLinked = new Set((existingLinks ?? []).map(l => l.transcription_entity_id))

  const toPromote = promotable.filter(e => !alreadyLinked.has(e.id))
  for (const local of toPromote) {
    const { data: entity, error: entErr } = await supabaseRebond.from('entities')
      .insert({ entity_type: local.entity_type, label: local.label })
      .select('id')
      .single()
    if (entErr) throw entErr
    const { error: newLinkErr } = await supabaseRebond.from('entity_links')
      .insert({ entity_id: entity.id, transcription_entity_id: local.id })
    if (newLinkErr) throw newLinkErr
  }
}

// Nombre de faits validés + nombre d'actes distincts qui mentionnent chaque
// entité — partagé entre le hub Entités et Réconciliation (qui en a besoin
// pour afficher les candidats de fusion sans dupliquer cette logique).
export async function computeEntityCounts(entityIds: string[]): Promise<Map<string, { factsCount: number; documentsCount: number }>> {
  const result = new Map<string, { factsCount: number; documentsCount: number }>()
  if (entityIds.length === 0) return result

  const { data: links, error: linkErr } = await supabaseRebond.from('entity_links')
    .select('entity_id, transcription_entity_id')
    .in('entity_id', entityIds)
  if (linkErr) throw linkErr

  const localIdsByEntity = new Map<string, string[]>()
  for (const l of links ?? []) {
    const arr = localIdsByEntity.get(l.entity_id) ?? []
    arr.push(l.transcription_entity_id)
    localIdsByEntity.set(l.entity_id, arr)
  }
  const allLocalIds = [...new Set((links ?? []).map(l => l.transcription_entity_id))]

  const { data: assertions } = allLocalIds.length
    ? await supabaseRebond.from('transcription_assertions')
      .select('subject_entity_id, transcription_version_id')
      .in('subject_entity_id', allLocalIds)
      .eq('status', 'validated')
    : { data: [] as Array<{ subject_entity_id: string; transcription_version_id: string }> }

  const factsCountByLocal = new Map<string, number>()
  const versionsByLocal = new Map<string, Set<string>>()
  for (const a of assertions ?? []) {
    factsCountByLocal.set(a.subject_entity_id, (factsCountByLocal.get(a.subject_entity_id) ?? 0) + 1)
    const set = versionsByLocal.get(a.subject_entity_id) ?? new Set<string>()
    set.add(a.transcription_version_id)
    versionsByLocal.set(a.subject_entity_id, set)
  }

  for (const entityId of entityIds) {
    const localIds = localIdsByEntity.get(entityId) ?? []
    const factsCount = localIds.reduce((sum, lid) => sum + (factsCountByLocal.get(lid) ?? 0), 0)
    const versionSet = new Set<string>()
    for (const lid of localIds) for (const v of versionsByLocal.get(lid) ?? []) versionSet.add(v)
    result.set(entityId, { factsCount, documentsCount: versionSet.size })
  }
  return result
}

export async function fetchEntities(opts?: { type?: EntityType; search?: string }): Promise<EntityListItem[]> {
  let query = supabaseRebond.from('entities')
    .select('id, entity_type, label, created_at')
    .is('merged_into_id', null)
  if (opts?.type) query = query.eq('entity_type', opts.type)
  if (opts?.search?.trim()) query = query.ilike('label', `%${opts.search.trim()}%`)
  const { data: entities, error } = await query.order('label', { ascending: true })
  if (error) throw error
  const list = entities ?? []
  if (list.length === 0) return []

  const counts = await computeEntityCounts(list.map(e => e.id))

  return list.map(e => ({
    id: e.id,
    entityType: e.entity_type as EntityType,
    label: e.label,
    createdAt: e.created_at,
    factsCount: counts.get(e.id)?.factsCount ?? 0,
    documentsCount: counts.get(e.id)?.documentsCount ?? 0,
  }))
}

export async function fetchEntityDetail(entityId: string): Promise<EntityDetail | null> {
  const { data: entity, error } = await supabaseRebond.from('entities')
    .select('id, entity_type, label, created_at')
    .eq('id', entityId)
    .maybeSingle()
  if (error) throw error
  if (!entity) return null

  const base: CanonicalEntity = { id: entity.id, entityType: entity.entity_type as EntityType, label: entity.label, createdAt: entity.created_at }

  const { data: links } = await supabaseRebond.from('entity_links')
    .select('transcription_entity_id')
    .eq('entity_id', entityId)
  const localIds = (links ?? []).map(l => l.transcription_entity_id)
  if (localIds.length === 0) return { ...base, facts: [], relations: [], documents: [] }

  const { data: rawAssertions, error: aErr } = await supabaseRebond.from('transcription_assertions')
    .select(`
      id, subject_entity_id, predicate_id, raw_relation, object_entity_id,
      value_text, value_number, value_date, source_text, source_start, source_end,
      status, origin, created_at, transcription_version_id,
      ref_assertion_predicates ( code, label )
    `)
    .in('subject_entity_id', localIds)
    .eq('status', 'validated')
  if (aErr) throw aErr

  const versionIds = [...new Set((rawAssertions ?? []).map(a => a.transcription_version_id))]
  const { docByVersion } = await resolveDocumentsByVersion(versionIds)

  // Local entities impliquées (sujet + objets) pour résoudre les libellés
  // via describeAssertion, qui attend un tableau ExtractionEntity[].
  const objectLocalIds = [...new Set((rawAssertions ?? []).map(a => a.object_entity_id).filter((v): v is string => !!v))]
  const involvedLocalIds = [...new Set([...localIds, ...objectLocalIds])]
  const { data: involvedLocalRows } = await supabaseRebond.from('transcription_entities')
    .select('id, local_key, label, entity_type')
    .in('id', involvedLocalIds)
  const localEntitiesForDescribe: ExtractionEntity[] = (involvedLocalRows ?? []).map(r => ({
    id: r.id, localKey: r.local_key, label: r.label,
    entityType: (r.entity_type === 'document' || r.entity_type === 'place' || r.entity_type === 'event') ? r.entity_type : 'person',
  }))

  const { data: objectLinks } = objectLocalIds.length
    ? await supabaseRebond.from('entity_links').select('transcription_entity_id, entity_id').in('transcription_entity_id', objectLocalIds)
    : { data: [] as Array<{ transcription_entity_id: string; entity_id: string }> }
  const canonicalByLocal = new Map((objectLinks ?? []).map(l => [l.transcription_entity_id, l.entity_id]))

  const facts: EntityFact[] = []
  const relations: EntityRelation[] = []
  const documentsMap = new Map<string, { exemplaireId: string; versionId: string; titre: string }>()

  for (const a of rawAssertions ?? []) {
    const pred = Array.isArray(a.ref_assertion_predicates) ? a.ref_assertion_predicates[0] : a.ref_assertion_predicates
    const code = pred?.code ?? 'other'
    const doc = docByVersion.get(a.transcription_version_id)
    if (doc && !documentsMap.has(a.transcription_version_id)) documentsMap.set(a.transcription_version_id, doc)

    if (RELATION_PREDICATES.has(code) && a.object_entity_id) {
      relations.push({
        predicateLabel: pred?.label ?? code,
        targetLabel: extractionEntityLabel(a.object_entity_id, localEntitiesForDescribe) ?? '?',
        targetEntityId: canonicalByLocal.get(a.object_entity_id) ?? null,
      })
      continue
    }

    const assertion: ExtractionAssertion = {
      id: a.id,
      subjectEntityId: a.subject_entity_id,
      predicateId: a.predicate_id,
      predicateCode: code,
      predicateLabel: pred?.label ?? code,
      rawRelation: a.raw_relation,
      objectEntityId: a.object_entity_id,
      valueText: a.value_text,
      valueNumber: a.value_number,
      valueDate: a.value_date,
      sourceText: a.source_text,
      sourceStart: a.source_start,
      sourceEnd: a.source_end,
      status: 'validated',
      origin: a.origin === 'manual' ? 'manual' : 'ai',
      createdAt: a.created_at,
    }
    facts.push({
      id: a.id,
      label: describeAssertion(assertion, localEntitiesForDescribe),
      sourceText: a.source_text ?? '',
      documentTitre: doc?.titre ?? 'Acte',
      exemplaireId: doc?.exemplaireId ?? '',
      versionId: a.transcription_version_id,
    })
  }

  return { ...base, facts, relations, documents: [...documentsMap.values()] }
}

// Résout version -> {exemplaireId, titre du document} par une chaîne de
// jointures batchées (pas de N+1) : version -> transcription -> exemplaire
// -> unité documentaire. Même logique que fetchExtractableExemplaires
// (extraction.service.ts), factorisable si un 3ᵉ module en a besoin un jour.
async function resolveDocumentsByVersion(versionIds: string[]) {
  const docByVersion = new Map<string, { exemplaireId: string; versionId: string; titre: string }>()
  if (versionIds.length === 0) return { docByVersion }

  const { data: versions } = await supabaseRebond.from('transcription_versions').select('id, transcription_id').in('id', versionIds)
  const transcriptionIdByVersion = new Map((versions ?? []).map(v => [v.id, v.transcription_id]))
  const transcriptionIds = [...new Set((versions ?? []).map(v => v.transcription_id))]

  const { data: transcriptions } = transcriptionIds.length
    ? await supabaseRebond.from('transcriptions').select('id, exemplaire_id').in('id', transcriptionIds)
    : { data: [] as Array<{ id: string; exemplaire_id: string }> }
  const exemplaireIdByTranscription = new Map((transcriptions ?? []).map(t => [t.id, t.exemplaire_id]))
  const exemplaireIds = [...new Set((transcriptions ?? []).map(t => t.exemplaire_id))]

  const { data: exemplaires } = exemplaireIds.length
    ? await supabaseRebond.from('exemplaires').select('id, unite_documentaire_id').in('id', exemplaireIds)
    : { data: [] as Array<{ id: string; unite_documentaire_id: string }> }
  const exemplaireById = new Map((exemplaires ?? []).map(e => [e.id, e]))
  const docIds = [...new Set((exemplaires ?? []).map(e => e.unite_documentaire_id))]

  const { data: docs } = docIds.length
    ? await supabaseRebond.from('unites_documentaires').select('id, titre').in('id', docIds)
    : { data: [] as Array<{ id: string; titre: string }> }
  const docById = new Map((docs ?? []).map(d => [d.id, d]))

  for (const versionId of versionIds) {
    const transcriptionId = transcriptionIdByVersion.get(versionId)
    const exemplaireId = transcriptionId ? exemplaireIdByTranscription.get(transcriptionId) : undefined
    const ex = exemplaireId ? exemplaireById.get(exemplaireId) : undefined
    const doc = ex ? docById.get(ex.unite_documentaire_id) : undefined
    if (exemplaireId) docByVersion.set(versionId, { exemplaireId, versionId, titre: doc?.titre ?? 'Acte' })
  }
  return { docByVersion }
}
