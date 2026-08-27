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
  // Ajoutés le 2026-08-10 (demande explicite) : numéro d'acte (etat_civil_actes/
  // hypotheques_actes.numero_acte, via la citation ec_acte/hyp_acte de cet
  // exemplaire) et vue propre à cet acte (citation.locating, avec repli sur
  // exemplaires.localisation_interne — même priorité que usePatrimoine.ts).
  numeroActe: string | null
  vue: string | null
}

export type AtelierDocumentHeader = {
  id: string
  titre: string
  couvertureLabel: string | null
  // Vue totale du registre parent (exemplaires.localisation_interne de sa
  // fiche de référence) — dénominateur pour afficher "vue X / Y" au niveau
  // de chaque exemplaire de ce document. Ajouté le 2026-08-10.
  registreVueRange: string | null
}

// Renvois au répertoire (hypothèques uniquement, 2026-08-10) — pour chaque
// partie (vendeur/acheteur) mentionnée dans la marge d'un acte hypothécaire,
// une référence volume/case vers sa ligne dans un répertoire des formalités
// (rebond.hypotheques_repertoire_entrees). Absent (null) si l'exemplaire en
// cours de transcription n'est pas un acte hypothécaire.
export type HypActeContext = {
  acteId: string
  bureauId: string
  typeFormaliteRef: string
}

// Bureau d'état civil de l'acte en cours — utilisé pour alimenter le
// contexte de la dictée (2026-08-27) : ces noms de lieux sont bien plus
// susceptibles d'apparaître dans le texte dicté que le libellé du dépôt
// (institution/service d'archives, sans rapport avec le contenu de l'acte).
export type EcActeBureauContext = {
  bureauNom: string
  commune: string | null
  departement: string | null
}

export type RepertoireEntreeRow = {
  id: string
  description: string | null
  caseNumero: string
  registreLabel: string
  // Nécessaire pour pré-remplir le formulaire d'édition (2026-08-10) — pas
  // déductible de registreLabel seul (texte généré, pas garanti parseable).
  numeroVolume: number
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

// Résumé d'une session de dictée vocale (enregistrement audio complet en
// filet de sécurité + compteurs) — un par clic "Dicter"/arrêt, pas une
// colonne sur transcriptions puisqu'une transcription peut accumuler
// plusieurs sessions de dictée dans le temps.
export type DictationSession = {
  id: string
  transcriptionId: string
  storagePath: string
  startedAt: string
  endedAt: string | null
  segmentsTotal: number
  segmentsCommitted: number
  segmentsError: number
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
