// entites.service.ts — accès données pour le module Entités (registre
// canonique cross-documents). Voir supabase/schema-docs/entities.md pour la
// doctrine complète (pourquoi ce registre est distinct de
// transcription_entities, pourquoi la promotion est automatique).

import { supabaseRebond } from '@/lib/supabase'
import { describeAssertion, entityLabel as extractionEntityLabel } from '../extraction/extraction.service'
import type { ExtractionAssertion, ExtractionEntity } from '../extraction/extraction.types'
import type { CanonicalEntity, EntityAttribute, EntityDetail, EntityFact, EntityListItem, EntityRelation, EntityType, PlaceTreeNode } from './entites.types'

// Prédicats relationnels (personne -> personne) affichés à part comme
// "relations directes" sur la fiche, plutôt que noyés dans la liste de
// faits — cf. doctrine posée avec l'utilisateur : la fiche reste une liste
// plate, pas un graphe (ça, c'est le rôle du futur module Graphe historique).
const RELATION_PREDICATES = new Set(['father', 'mother', 'spouse', 'child', 'sibling', 'relative', 'neighbor', 'friend'])

// Doctrine d'extraction (index.ts, "Sens des relations entre personnes") :
// "subject -- father/mother --> object" signifie TOUJOURS "le père/la mère
// du sujet est l'objet", une seule direction est stockée, jamais les deux.
// Conséquence : une relation où notre entité est SEULEMENT l'OBJET (ex.
// "Gabrielle -- mother --> Charbonné" = Charbonné est la mère de Gabrielle)
// est invisible depuis la fiche de Charbonné si on ne regarde que les
// assertions où elle est sujet (2026-08-14, signalé explicitement par
// l'utilisateur : "il manque des faits"). fetchEntityDetail interroge donc
// aussi les assertions où l'entité est OBJET, et les affiche en sens
// inverse via cette table (le label décrit alors le rôle de LA CIBLE par
// rapport à l'entité — ex. "Enfant : Gabrielle" sur la fiche de Charbonné,
// symétrique de "Mère : Charbonné" qu'on aurait sur la fiche de Gabrielle).
const INVERSE_RELATION_LABEL: Record<string, string> = {
  father: 'Enfant',
  mother: 'Enfant',
  child: 'Parent',
  spouse: 'Conjoint(e)',
  sibling: 'Frère / sœur',
  relative: 'Autre lien de parenté',
  neighbor: 'Voisin',
  friend: 'Ami / connaissance',
}

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
//
// Compte les assertions où l'entité est SUJET mais aussi celles où elle est
// seulement OBJET (ex. un lieu cité comme parent d'un autre via
// "administrative_area", ou comme domicile d'une personne) — une entité
// purement référentielle (jamais sujet d'un fait qui lui est propre)
// affichait 0/0 alors qu'elle est bien "utilisée" par d'autres faits
// (2026-08-15, signalé par l'utilisateur : "j'ai des entités lieux sans
// faits ni actes"). Un même fait où sujet ET objet appartiennent à la même
// entité (rare, ex. deux entités locales fusionnées plus tard dans la même
// fiche) n'est compté qu'une fois par entité grâce au Set d'ids d'assertion.
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

  const [{ data: subjectAssertions }, { data: objectAssertions }] = allLocalIds.length
    ? await Promise.all([
      supabaseRebond.from('transcription_assertions')
        .select('id, subject_entity_id, transcription_version_id')
        .in('subject_entity_id', allLocalIds)
        .eq('status', 'validated'),
      supabaseRebond.from('transcription_assertions')
        .select('id, object_entity_id, transcription_version_id')
        .in('object_entity_id', allLocalIds)
        .eq('status', 'validated'),
    ])
    : [{ data: [] as Array<{ id: string; subject_entity_id: string; transcription_version_id: string }> }, { data: [] as Array<{ id: string; object_entity_id: string; transcription_version_id: string }> }]

  // localId -> Set<assertionId> (dédoublonne un fait où sujet et objet
  // pointent tous deux vers un id local de la même entité).
  const assertionIdsByLocal = new Map<string, Set<string>>()
  const versionsByLocal = new Map<string, Set<string>>()
  const addHit = (localId: string, assertionId: string, versionId: string) => {
    const ids = assertionIdsByLocal.get(localId) ?? new Set<string>()
    ids.add(assertionId)
    assertionIdsByLocal.set(localId, ids)
    const versions = versionsByLocal.get(localId) ?? new Set<string>()
    versions.add(versionId)
    versionsByLocal.set(localId, versions)
  }
  for (const a of subjectAssertions ?? []) addHit(a.subject_entity_id, a.id, a.transcription_version_id)
  for (const a of objectAssertions ?? []) addHit(a.object_entity_id, a.id, a.transcription_version_id)

  for (const entityId of entityIds) {
    const localIds = localIdsByEntity.get(entityId) ?? []
    const assertionIds = new Set<string>()
    const versionSet = new Set<string>()
    for (const lid of localIds) {
      for (const id of assertionIdsByLocal.get(lid) ?? []) assertionIds.add(id)
      for (const v of versionsByLocal.get(lid) ?? []) versionSet.add(v)
    }
    result.set(entityId, { factsCount: assertionIds.size, documentsCount: versionSet.size })
  }
  return result
}

// Qualité (niveau administratif : commune/section/hameau/habitation...)
// d'une entité "lieu", tirée du prédicat "quality" — pour comparer avant
// fusion (Réconciliation) que deux fiches au même libellé sont bien du
// même niveau, pas une commune fusionnée par erreur avec une section
// homonyme (2026-08-15, demande explicite). Une entité peut porter
// plusieurs valeurs si les actes se contredisent — toutes renvoyées, pas
// juste la première, la contradiction elle-même est un signal utile.
export async function fetchEntityQualities(entityIds: string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>()
  if (entityIds.length === 0) return result

  const { data: pred } = await supabaseRebond.from('ref_assertion_predicates').select('id').eq('code', 'quality').maybeSingle()
  if (!pred) return result

  const { data: links } = await supabaseRebond.from('entity_links')
    .select('entity_id, transcription_entity_id')
    .in('entity_id', entityIds)
  const entityByLocal = new Map((links ?? []).map(l => [l.transcription_entity_id, l.entity_id]))
  const localIds = [...entityByLocal.keys()]
  if (localIds.length === 0) return result

  const { data: assertions } = await supabaseRebond.from('transcription_assertions')
    .select('subject_entity_id, value_text')
    .in('subject_entity_id', localIds)
    .eq('status', 'validated')
    .eq('predicate_id', pred.id)

  for (const a of assertions ?? []) {
    if (!a.value_text) continue
    const entityId = entityByLocal.get(a.subject_entity_id)
    if (!entityId) continue
    const arr = result.get(entityId) ?? []
    if (!arr.includes(a.value_text)) arr.push(a.value_text)
    result.set(entityId, arr)
  }
  return result
}

// Chaîne hiérarchique complète d'un lieu (2026-08-15, demande explicite
// avec exemples précis : distinguer "Caféyère, hameau de la section
// Caféyère de la commune de Deshaies" de "Caféyère, section de la commune
// de Deshaies" — un seul niveau ne suffit pas, il faut remonter jusqu'en
// haut). Remonte le prédicat "administrative_area" de parent en parent,
// PAS limité à un acte précis : le rattachement administratif d'un lieu
// est une info stable, rarement redite intégralement dans une seule
// citation — la première mention validée à chaque niveau suffit à la
// retenir. Tout batché (une poignée de requêtes sur TOUS les lieux actifs,
// pas une par lieu demandé) puis la remontée de chaîne se fait en mémoire,
// avec garde-fou anti-boucle (parentByEntity ne peut jamais boucler sur
// lui-même, et la profondeur est plafonnée).
// Construit le graphe complet lieu->parent (prédicat "administrative_area")
// sur TOUS les lieux actifs — factorisé pour être partagé entre
// fetchPlaceHierarchies (remonte vers les parents) et fetchPlaceDescendants
// (descend vers les enfants), plutôt que de refaire les mêmes requêtes
// batchées deux fois.
async function buildPlaceHierarchyGraph(): Promise<{
  labelById: Map<string, string>
  qualities: Map<string, string[]>
  parentByEntity: Map<string, string>
}> {
  const { data: allPlaces } = await supabaseRebond.from('entities').select('id, label').eq('entity_type', 'place').is('merged_into_id', null)
  const labelById = new Map((allPlaces ?? []).map(e => [e.id, e.label]))
  const allIds = [...labelById.keys()]
  if (allIds.length === 0) return { labelById, qualities: new Map(), parentByEntity: new Map() }

  const qualities = await fetchEntityQualities(allIds)

  const { data: links } = await supabaseRebond.from('entity_links').select('entity_id, transcription_entity_id').in('entity_id', allIds)
  const entityByLocal = new Map((links ?? []).map(l => [l.transcription_entity_id, l.entity_id]))
  const localIds = [...entityByLocal.keys()]

  const { data: areaPred } = await supabaseRebond.from('ref_assertion_predicates').select('id').eq('code', 'administrative_area').maybeSingle()
  const parentByEntity = new Map<string, string>()
  if (areaPred && localIds.length > 0) {
    const { data: assertions } = await supabaseRebond.from('transcription_assertions')
      .select('subject_entity_id, object_entity_id')
      .in('subject_entity_id', localIds)
      .eq('status', 'validated')
      .eq('predicate_id', areaPred.id)
      .not('object_entity_id', 'is', null)

    const objectLocalIds = [...new Set((assertions ?? []).map(a => a.object_entity_id).filter((v): v is string => !!v))]
    const { data: objectLinks } = objectLocalIds.length
      ? await supabaseRebond.from('entity_links').select('entity_id, transcription_entity_id').in('transcription_entity_id', objectLocalIds)
      : { data: [] as Array<{ entity_id: string; transcription_entity_id: string }> }
    const canonicalByObjectLocal = new Map((objectLinks ?? []).map(l => [l.transcription_entity_id, l.entity_id]))

    for (const a of assertions ?? []) {
      const childEntity = entityByLocal.get(a.subject_entity_id)
      const parentEntity = a.object_entity_id ? canonicalByObjectLocal.get(a.object_entity_id) : undefined
      if (childEntity && parentEntity && childEntity !== parentEntity && !parentByEntity.has(childEntity)) {
        parentByEntity.set(childEntity, parentEntity)
      }
    }
  }

  return { labelById, qualities, parentByEntity }
}

export async function fetchPlaceHierarchies(entityIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (entityIds.length === 0) return result

  const { labelById, qualities, parentByEntity } = await buildPlaceHierarchyGraph()
  if (labelById.size === 0) return result

  function chainFor(id: string): { label: string; quality: string | null }[] {
    const chain: { label: string; quality: string | null }[] = []
    const seen = new Set<string>()
    let current: string | undefined = id
    while (current && !seen.has(current) && chain.length < 8) {
      seen.add(current)
      const label = labelById.get(current)
      if (!label) break
      chain.push({ label, quality: qualities.get(current)?.[0] ?? null })
      current = parentByEntity.get(current)
    }
    return chain
  }

  for (const id of entityIds) {
    const chain = chainFor(id)
    result.set(id, chain.map(l => (l.quality ? `${l.label} (${l.quality})` : l.label)).join(' → '))
  }
  return result
}

// Arbre hiérarchique DESCENDANT d'un lieu (2026-08-15, demande explicite :
// "je veux voir une hiérarchie descendante de ses sections, hameaux etc.
// dans un onglet dédié") — symétrique de fetchPlaceHierarchies (qui remonte
// vers les parents pour désambiguïser des homonymes en Réconciliation),
// ici on descend depuis un lieu donné vers tout ce qui le cite comme
// "administrative_area". Même graphe batché que fetchPlaceHierarchies
// (une seule construction, pas dupliquée), juste parcouru dans l'autre
// sens (enfants = tout id dont le parent est le nœud courant). Retourne
// `null` si le lieu n'existe pas/n'est plus actif (fusionné).
export async function fetchPlaceDescendants(rootEntityId: string): Promise<PlaceTreeNode | null> {
  const { labelById, qualities, parentByEntity } = await buildPlaceHierarchyGraph()
  if (!labelById.has(rootEntityId)) return null

  const childrenByParent = new Map<string, string[]>()
  for (const [child, parent] of parentByEntity) {
    const arr = childrenByParent.get(parent) ?? []
    arr.push(child)
    childrenByParent.set(parent, arr)
  }

  function build(id: string, seen: Set<string>, depth: number): PlaceTreeNode {
    const node: PlaceTreeNode = {
      entityId: id,
      label: labelById.get(id) ?? '?',
      quality: qualities.get(id)?.[0] ?? null,
      children: [],
    }
    if (seen.has(id) || depth >= 8) return node
    const nextSeen = new Set(seen)
    nextSeen.add(id)
    const childIds = (childrenByParent.get(id) ?? [])
      .slice()
      .sort((a, b) => (labelById.get(a) ?? '').localeCompare(labelById.get(b) ?? ''))
    node.children = childIds.map(cid => build(cid, nextSeen, depth + 1))
    return node
  }

  return build(rootEntityId, new Set(), 0)
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
  if (localIds.length === 0) return { ...base, facts: [], mentions: [], relations: [], documents: [] }

  const selectCols = `
      id, subject_entity_id, predicate_id, raw_relation, object_entity_id,
      value_text, value_number, value_date, source_text, source_start, source_end,
      status, origin, created_at, transcription_version_id,
      ref_assertion_predicates ( code, label )
    `

  const { data: rawAssertions, error: aErr } = await supabaseRebond.from('transcription_assertions')
    .select(selectCols)
    .in('subject_entity_id', localIds)
    .eq('status', 'validated')
  if (aErr) throw aErr

  // Assertions où l'entité est OBJET plutôt que sujet — voir
  // INVERSE_RELATION_LABEL ci-dessus. Ne concerne que les prédicats
  // relationnels (une assertion non-relationnelle où l'entité est objet,
  // ex. "authorizes"/"located_on", n'a pas de sens comme fait sur SA propre
  // fiche — hors scope de ce correctif).
  const { data: rawInverseAssertions, error: invErr } = await supabaseRebond.from('transcription_assertions')
    .select(selectCols)
    .in('object_entity_id', localIds)
    .eq('status', 'validated')
  if (invErr) throw invErr
  const inverseRelationRows = (rawInverseAssertions ?? []).filter(a => {
    const pred = Array.isArray(a.ref_assertion_predicates) ? a.ref_assertion_predicates[0] : a.ref_assertion_predicates
    return RELATION_PREDICATES.has(pred?.code ?? '')
  })
  // Complément : assertions où l'entité est objet mais le prédicat n'est PAS
  // relationnel personne-personne (ex. administrative_area, domicile) — vont
  // dans `mentions`, pas `facts` ni `relations`. Voir commentaire sur
  // EntityDetail.mentions (entites.types.ts) pour le pourquoi de la séparation.
  const inverseFactRows = (rawInverseAssertions ?? []).filter(a => {
    const pred = Array.isArray(a.ref_assertion_predicates) ? a.ref_assertion_predicates[0] : a.ref_assertion_predicates
    return !RELATION_PREDICATES.has(pred?.code ?? '')
  })

  const versionIds = [...new Set([
    ...(rawAssertions ?? []).map(a => a.transcription_version_id),
    ...inverseRelationRows.map(a => a.transcription_version_id),
    ...inverseFactRows.map(a => a.transcription_version_id),
  ])]
  const { docByVersion } = await resolveDocumentsByVersion(versionIds)

  // Local entities impliquées (sujet + objets, dans les deux sens) pour
  // résoudre les libellés via describeAssertion, qui attend un tableau
  // ExtractionEntity[].
  const objectLocalIds = [...new Set((rawAssertions ?? []).map(a => a.object_entity_id).filter((v): v is string => !!v))]
  const inverseSubjectIds = [...new Set([...inverseRelationRows, ...inverseFactRows].map(a => a.subject_entity_id))]
  const involvedLocalIds = [...new Set([...localIds, ...objectLocalIds, ...inverseSubjectIds])]
  const { data: involvedLocalRows } = await supabaseRebond.from('transcription_entities')
    .select('id, local_key, label, entity_type')
    .in('id', involvedLocalIds)
  const localEntitiesForDescribe: ExtractionEntity[] = (involvedLocalRows ?? []).map(r => ({
    id: r.id, localKey: r.local_key, label: r.label,
    entityType: (r.entity_type === 'document' || r.entity_type === 'place' || r.entity_type === 'event') ? r.entity_type : 'person',
  }))

  const canonicalLookupIds = [...new Set([...objectLocalIds, ...inverseSubjectIds])]
  const { data: canonicalLinks } = canonicalLookupIds.length
    ? await supabaseRebond.from('entity_links').select('transcription_entity_id, entity_id').in('transcription_entity_id', canonicalLookupIds)
    : { data: [] as Array<{ transcription_entity_id: string; entity_id: string }> }
  const canonicalByLocal = new Map((canonicalLinks ?? []).map(l => [l.transcription_entity_id, l.entity_id]))

  const facts: EntityFact[] = []
  const relations: EntityRelation[] = []
  const documentsMap = new Map<string, { exemplaireId: string; versionId: string; titre: string; date: string | null }>()

  for (const a of rawAssertions ?? []) {
    const pred = Array.isArray(a.ref_assertion_predicates) ? a.ref_assertion_predicates[0] : a.ref_assertion_predicates
    const code = pred?.code ?? 'other'
    const doc = docByVersion.get(a.transcription_version_id)
    if (doc && !documentsMap.has(a.transcription_version_id)) documentsMap.set(a.transcription_version_id, doc)

    if (RELATION_PREDICATES.has(code) && a.object_entity_id) {
      relations.push({
        id: a.id,
        predicateLabel: pred?.label ?? code,
        ownRoleLabel: INVERSE_RELATION_LABEL[code] ?? (pred?.label ?? code),
        targetLabel: extractionEntityLabel(a.object_entity_id, localEntitiesForDescribe) ?? '?',
        targetEntityId: canonicalByLocal.get(a.object_entity_id) ?? null,
        exemplaireId: doc?.exemplaireId ?? '',
        versionId: a.transcription_version_id,
        documentTitre: doc?.titre ?? 'Acte',
        documentDate: doc?.date ?? null,
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
      conflictGroupId: null,
    }
    facts.push({
      id: a.id,
      label: describeAssertion(assertion, localEntitiesForDescribe),
      sourceText: a.source_text ?? '',
      documentTitre: doc?.titre ?? 'Acte',
      documentDate: doc?.date ?? null,
      exemplaireId: doc?.exemplaireId ?? '',
      versionId: a.transcription_version_id,
      predicateCode: code,
      valueText: a.value_text,
      valueNumber: a.value_number,
      valueDate: a.value_date,
      objectLabel: a.object_entity_id ? (extractionEntityLabel(a.object_entity_id, localEntitiesForDescribe) ?? null) : null,
      objectEntityId: a.object_entity_id ? (canonicalByLocal.get(a.object_entity_id) ?? null) : null,
    })
  }

  for (const a of inverseRelationRows) {
    const pred = Array.isArray(a.ref_assertion_predicates) ? a.ref_assertion_predicates[0] : a.ref_assertion_predicates
    const code = pred?.code ?? 'other'
    const doc = docByVersion.get(a.transcription_version_id)
    if (doc && !documentsMap.has(a.transcription_version_id)) documentsMap.set(a.transcription_version_id, doc)

    relations.push({
      id: a.id,
      predicateLabel: INVERSE_RELATION_LABEL[code] ?? (pred?.label ?? code),
      ownRoleLabel: pred?.label ?? code,
      targetLabel: extractionEntityLabel(a.subject_entity_id, localEntitiesForDescribe) ?? '?',
      targetEntityId: canonicalByLocal.get(a.subject_entity_id) ?? null,
      exemplaireId: doc?.exemplaireId ?? '',
      versionId: a.transcription_version_id,
      documentTitre: doc?.titre ?? 'Acte',
      documentDate: doc?.date ?? null,
    })
  }

  const mentions: EntityFact[] = []
  for (const a of inverseFactRows) {
    const pred = Array.isArray(a.ref_assertion_predicates) ? a.ref_assertion_predicates[0] : a.ref_assertion_predicates
    const code = pred?.code ?? 'other'
    const doc = docByVersion.get(a.transcription_version_id)
    if (doc && !documentsMap.has(a.transcription_version_id)) documentsMap.set(a.transcription_version_id, doc)

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
      conflictGroupId: null,
    }
    mentions.push({
      id: a.id,
      label: describeAssertion(assertion, localEntitiesForDescribe),
      sourceText: a.source_text ?? '',
      documentTitre: doc?.titre ?? 'Acte',
      documentDate: doc?.date ?? null,
      exemplaireId: doc?.exemplaireId ?? '',
      versionId: a.transcription_version_id,
      predicateCode: code,
      valueText: a.value_text,
      valueNumber: a.value_number,
      valueDate: a.value_date,
      objectLabel: null,
      objectEntityId: null,
    })
  }

  return { ...base, facts, mentions, relations, documents: [...documentsMap.values()] }
}

// Renommage manuel (2026-08-10, demande explicite) — jusqu'ici le libellé
// était figé à celui de la première promotion (voir schema-docs). Ne touche
// que la fiche canonique, jamais l'entité locale d'origine
// (transcription_entities, qui reste fidèle au texte source de l'acte).
export async function renameEntity(entityId: string, label: string): Promise<void> {
  const trimmed = label.trim()
  if (!trimmed) throw new Error('Le libellé ne peut pas être vide')
  const { error } = await supabaseRebond.from('entities').update({ label: trimmed }).eq('id', entityId)
  if (error) throw error
}

// Suppression définitive (2026-08-10, demande explicite) — première
// dérogation à la doctrine "aucune suppression" de ce module (jusqu'ici
// seule la fusion existait, et elle ne supprime jamais). Sert à corriger une
// entité canonique erronée (ex. une mauvaise fusion de lieux promue par
// erreur), pas à "dé-promouvoir" une entité légitime.
// `entity_links.entity_id` est ON DELETE CASCADE : les liens vers cette
// entité disparaissent avec elle, mais les entités locales
// (transcription_entities) et leurs assertions ne sont PAS touchées — si
// l'une d'elles est revalidée plus tard, ensureEntitiesPromoted recréera une
// entité canonique automatiquement (comportement normal, pas un bug).
// `merged_into_id` est ON DELETE SET NULL : si cette entité était le
// survivant d'une fusion, les entités fusionnées redeviennent actives
// (visibles à nouveau dans les listes/Réconciliation) plutôt que de pointer
// vers une fiche qui n'existe plus.
export async function deleteEntity(entityId: string): Promise<void> {
  const { error } = await supabaseRebond.from('entities').delete().eq('id', entityId)
  if (error) throw error
}

// Informations d'identité validées manuellement (2026-08-13, module Individu
// rapatrié, onglet "Informations à valider") — table rebond.entity_attributes.
// Deux niveaux (voir EntityAttribute.versionId) : une synthèse globale par
// attribut (cross-actes) ET, depuis le 2026-08-14, une fiche "acteur" par
// acte où chaque champ est sourcé sur un fait précis de CET acte. Une seule
// valeur retenue par (entité, attribut, acte) : upsertEntityAttribute
// remplace la précédente en cas de nouvelle validation (correction), pas
// d'historique conservé dans cette première version.
export async function fetchEntityAttributes(entityId: string): Promise<EntityAttribute[]> {
  const { data, error } = await supabaseRebond.from('entity_attributes')
    .select('id, attribute_code, value, source_fact_ids, validated_at, version_id')
    .eq('entity_id', entityId)
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id,
    attributeCode: r.attribute_code,
    value: r.value,
    sourceFactIds: r.source_fact_ids ?? [],
    validatedAt: r.validated_at,
    versionId: r.version_id,
  }))
}

// versionId null = valeur globale (comportement historique) ; renseigné =
// valeur propre à cet acte. Pas de .upsert()/onConflict ici : l'unicité
// réelle repose sur un index partiel (coalesce(version_id, uuid nul)) que
// PostgREST ne peut pas cibler directement comme conflict target — on fait
// donc l'équivalent à la main (chercher, puis update ou insert).
export async function upsertEntityAttribute(
  entityId: string,
  attributeCode: string,
  value: string,
  sourceFactIds: string[],
  versionId: string | null = null,
): Promise<void> {
  let existingQuery = supabaseRebond.from('entity_attributes')
    .select('id')
    .eq('entity_id', entityId)
    .eq('attribute_code', attributeCode)
  existingQuery = versionId ? existingQuery.eq('version_id', versionId) : existingQuery.is('version_id', null)
  const { data: existing, error: selErr } = await existingQuery.maybeSingle()
  if (selErr) throw selErr

  if (existing) {
    const { error } = await supabaseRebond.from('entity_attributes')
      .update({ value, source_fact_ids: sourceFactIds, validated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabaseRebond.from('entity_attributes')
      .insert({ entity_id: entityId, attribute_code: attributeCode, value, source_fact_ids: sourceFactIds, version_id: versionId, validated_at: new Date().toISOString() })
    if (error) throw error
  }
}

// Résout version -> {exemplaireId, titre du document, date de l'acte} par
// une chaîne de jointures batchées (pas de N+1) : version -> transcription
// -> exemplaire -> unité documentaire, + exemplaire -> citations -> acte
// d'état civil pour la date (même chaîne que l'auto-remplissage de
// "Couverture temporelle" dans PatrimoineDocumentairePage.tsx). Les actes
// hypothécaires n'ont pas de colonne date propre (voir hypotheques_actes) —
// date reste null dans ce cas, pas une erreur.
async function resolveDocumentsByVersion(versionIds: string[]) {
  const docByVersion = new Map<string, { exemplaireId: string; versionId: string; titre: string; date: string | null }>()
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

  const { data: citations } = exemplaireIds.length
    ? await supabaseRebond.from('citations').select('exemplaire_id, target_type, target_id').eq('target_type', 'ec_acte').in('exemplaire_id', exemplaireIds)
    : { data: [] as Array<{ exemplaire_id: string; target_type: string; target_id: string }> }
  const ecActeIds = [...new Set((citations ?? []).map(c => c.target_id))]
  const { data: ecActes } = ecActeIds.length
    ? await supabaseRebond.from('etat_civil_actes').select('id, date').in('id', ecActeIds)
    : { data: [] as Array<{ id: string; date: string | null }> }
  const dateByEcActeId = new Map((ecActes ?? []).map(a => [a.id, a.date]))
  const dateByExemplaireId = new Map<string, string | null>()
  for (const c of citations ?? []) {
    const date = dateByEcActeId.get(c.target_id)
    if (date) dateByExemplaireId.set(c.exemplaire_id, date)
  }

  for (const versionId of versionIds) {
    const transcriptionId = transcriptionIdByVersion.get(versionId)
    const exemplaireId = transcriptionId ? exemplaireIdByTranscription.get(transcriptionId) : undefined
    const ex = exemplaireId ? exemplaireById.get(exemplaireId) : undefined
    const doc = ex ? docById.get(ex.unite_documentaire_id) : undefined
    if (exemplaireId) docByVersion.set(versionId, { exemplaireId, versionId, titre: doc?.titre ?? 'Acte', date: dateByExemplaireId.get(exemplaireId) ?? null })
  }
  return { docByVersion }
}
