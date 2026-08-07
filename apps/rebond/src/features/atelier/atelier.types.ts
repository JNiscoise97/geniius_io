// atelier.types.ts — types UI pour l'atelier documentaire (transcription).

export type TranscriptionStatut = 'non_commence' | 'en_cours' | 'termine'

export type AtelierExemplaire = {
  id: string
  coteLocale: string | null
  identifiantInterne: string | null
  localisationInterne: string | null
  note: string | null
  natureLabel: string | null
  depotLabel: string | null
  estReference: boolean
  transcriptionStatut: TranscriptionStatut
  transcriptionUpdatedAt: string | null
}

export type AtelierDocumentHeader = {
  id: string
  titre: string
  couvertureLabel: string | null
}

export type TranscriptionVersion = {
  id: string
  version: number
  contenu: unknown
  changeSummary: string | null
  createdAt: string
}

export type CommentaireStatut = 'ouvert' | 'resolu'

export type TranscriptionCommentaire = {
  id: string
  contenu: string
  statut: CommentaireStatut
  createdAt: string
  resolvedAt: string | null
}

export type TranscriptionZoneType = {
  id: string
  code: string
  label: string
}

export type TranscriptionZone = {
  id: string
  zoneTypeId: string
  contenu: string
  createdAt: string
}

// Ce qui est "attendu" pour une zone (mention marginale, signature, rature)
// d'après la description de l'exemplaire dans Patrimoine documentaire
// (citations.marginalia, saisi à l'étape "Décrire") — complémentaire au
// contenu réellement relevé dans l'atelier documentaire (transcription_zones).
export type ZoneAttendu = {
  present: boolean | null
  count: number | null
}

export type SourceLectureKind = 'image_originale' | 'microfilm' | 'transcription_secondaire' | 'autre'
export type Completeness = 'complete' | 'partielle' | 'fragment'
export type ReserveLevel = 'aucune' | 'mineure' | 'majeure'

export type TranscriptionQualite = {
  sourceLectureKind: SourceLectureKind | null
  langueRef: string | null
  ecritureRef: string | null
  handwritingLegibilityRef: string | null
  completeness: Completeness
  completenessNote: string | null
  reserveLevel: ReserveLevel
  reserveReason: string | null
}
