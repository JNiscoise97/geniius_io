// extraction.types.ts — types UI pour le module Extraction (assertions IA).

export type AssertionStatus = 'pending' | 'validated' | 'rejected'

// 'ai' = telle que produite par l'extraction, jamais modifiée depuis.
// 'manual' = ajoutée ou corrigée directement par un humain (édition ou
// ajout manuel, cf. extraction.service.ts).
export type AssertionOrigin = 'ai' | 'manual'

export type EntityType = 'person' | 'document' | 'place' | 'event'

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
