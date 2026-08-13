// extraction.types.ts — types UI pour le module Extraction (assertions IA).

// 'conflicting' (2026-08-11) : deux assertions distinctes (citations
// différentes) sur le même subject+predicate donnent des valeurs qui SE
// CONTREDISENT (ex. deux prix de vente différents trouvés à deux endroits
// du texte) — détecté à l'insertion (extraction.service.ts), voir
// conflictGroupId sur ExtractionAssertion. Les deux assertions restent
// visibles et doivent être tranchées par un humain plutôt que déduplicées.
export type AssertionStatus = 'pending' | 'validated' | 'rejected' | 'conflicting'

// 'ai' = telle que produite par l'extraction, jamais modifiée depuis.
// 'manual' = ajoutée ou corrigée directement par un humain (édition ou
// ajout manuel, cf. extraction.service.ts).
export type AssertionOrigin = 'ai' | 'manual'

// 'property' (2026-08-11) : un bien précis (terrain, maison...), objet
// d'une vente/succession — distinct de 'place' (lieu géographique/
// administratif qui situe : commune, section, hameau...). Voir migration
// 20260811100001 et la doctrine "L'entité property" côté extract-assertions.
export type EntityType = 'person' | 'document' | 'place' | 'event' | 'property'

export type ExtractionEntity = {
  id: string
  localKey: string
  label: string
  entityType: EntityType
}

export type ExtractionAssertion = {
  id: string
  subjectEntityId: string
  predicateId: string
  predicateCode: string
  predicateLabel: string
  rawRelation: string | null
  objectEntityId: string | null
  valueText: string | null
  valueNumber: number | null
  valueDate: string | null
  sourceText: string | null
  sourceStart: number | null
  sourceEnd: number | null
  status: AssertionStatus
  origin: AssertionOrigin
  createdAt: string
  conflictGroupId: string | null
}

export type Predicate = {
  id: string
  code: string
  label: string
}

// Un exemplaire "transcrit" = qui a au moins une version enregistrée
// (rebond.transcription_versions) — c'est de là que part l'extraction, pas
// du brouillon courant. On ne montre que la version la plus récente par
// exemplaire dans le hub ; les autres versions restent accessibles depuis
// l'éditeur de transcription (panneau Historique).
export type ExtractableExemplaire = {
  exemplaireId: string
  documentId: string
  documentTitre: string
  registreName: string | null
  coteLocale: string | null
  latestVersionId: string
  latestVersionNumber: number
  latestVersionCreatedAt: string
  assertionsCount: number
  pendingCount: number
}

// Résultat de recherche pour "Comparer avec un autre acte" (2026-08-10) —
// juste de quoi lister/choisir, le détail (assertions/entités) n'est chargé
// qu'à la sélection, même pattern que TranscriptionSearchResult (atelier).
export type ActeCompareSearchResult = {
  versionId: string
  exemplaireId: string
  documentTitre: string
  coteLocale: string | null
  assertionsCount: number
}
