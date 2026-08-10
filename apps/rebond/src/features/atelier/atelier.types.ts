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

// Résultat de recherche pour "Comparer avec un autre exemplaire" — juste
// de quoi afficher une liste sélectionnable (le contenu complet n'est
// chargé qu'à la sélection, via fetchTranscription).
export type TranscriptionSearchResult = {
  exemplaireId: string
  documentId: string
  documentTitre: string
  coteLocale: string | null
  statut: TranscriptionStatut
  updatedAt: string
}

// Instantané dénormalisé des zones à l'intérieur d'une version — pas les
// mêmes objets que TranscriptionZone (pas d'id/createdAt propres à la
// version, juste ce qui définit le fait relevé).
export type ZoneSnapshotEntry = { zoneTypeId: string; contenu: string }

export type TranscriptionVersion = {
  id: string
  version: number
  contenu: unknown
  changeSummary: string | null
  zonesSnapshot: ZoneSnapshotEntry[]
  qualiteSnapshot: TranscriptionQualite
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

// Valeur par défaut — sert à la fois d'état initial du formulaire et de
// "baseline" de comparaison pour isDirty quand aucune version n'existe
// encore (cf. computeIsDirty dans TranscriptionEditorPage.tsx).
export const QUALITE_VIDE: TranscriptionQualite = {
  sourceLectureKind: null,
  langueRef: null,
  ecritureRef: null,
  handwritingLegibilityRef: null,
  completeness: 'complete',
  completenessNote: null,
  reserveLevel: 'aucune',
  reserveReason: null,
}
