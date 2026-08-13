// entites.types.ts — types UI pour le module Entités (registre canonique).
//
// Distinct de src/features/extraction/extraction.types.ts : ExtractionEntity
// est locale à une version de transcription (P1, P2...), CanonicalEntity
// existe indépendamment de tout document précis — voir entites.service.ts
// pour comment l'une devient l'autre (promotion).

export type EntityType = 'person' | 'place'

export type CanonicalEntity = {
  id: string
  entityType: EntityType
  label: string
  createdAt: string
}

// Une ligne de la liste (hub) : l'entité + quelques compteurs pour donner un
// aperçu sans ouvrir la fiche.
export type EntityListItem = CanonicalEntity & {
  factsCount: number
  documentsCount: number
}

// Un "fait" sur la fiche : assertion validée résolue en texte lisible, avec
// un lien vers l'acte source. Même esprit que ExtractionAssertion +
// describeAssertion, mais déjà résolu côté service pour rester simple côté
// composant (la fiche affiche, elle ne recalcule pas).
//
// predicateCode/valueText/valueNumber/valueDate exposent la donnée brute
// sous-jacente (pas seulement le label déjà formulé) — nécessaire pour
// l'analyse par attribut de l'onglet "Informations à valider" (module
// Individu rapatrié), qui doit regrouper les faits par type de champ plutôt
// que par phrase.
export type EntityFact = {
  id: string
  label: string
  sourceText: string
  documentTitre: string
  exemplaireId: string
  versionId: string
  predicateCode: string
  valueText: string | null
  valueNumber: number | null
  valueDate: string | null
}

// Une relation directe (père/mère/conjoint/enfant/frère-sœur/proche/
// voisin/ami) résolue vers une autre entité canonique si elle a déjà été
// promue, sinon vers un simple libellé non cliquable.
export type EntityRelation = {
  predicateLabel: string
  targetLabel: string
  targetEntityId: string | null
}

export type EntityDetail = CanonicalEntity & {
  facts: EntityFact[]
  relations: EntityRelation[]
  documents: { exemplaireId: string; versionId: string; titre: string }[]
}

// Une information d'identité validée manuellement pour une entité (ex. la
// date de naissance retenue parmi plusieurs mentions concurrentes dans les
// faits) — voir rebond.entity_attributes / onglet "Informations à valider"
// du module Individu.
export type EntityAttribute = {
  id: string
  attributeCode: string
  value: string
  sourceFactIds: string[]
  validatedAt: string
}
