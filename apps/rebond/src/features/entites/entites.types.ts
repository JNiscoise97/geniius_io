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
// que par phrase. documentDate est la date de L'ACTE lui-même (distincte de
// valueDate, qui est la date PORTÉE PAR le fait quand il en a une, ex.
// birth_date) — nécessaire pour remplir la colonne "Date" du tableau "Ligne
// de vie" même sur des faits sans date propre (qualité, profession...).
// objectLabel/objectEntityId : certains faits non-relationnels portent
// quand même un objet (ex. "administrative_area" — un lieu situé dans un
// autre, value_text reste null, l'info est uniquement dans l'objet) —
// nécessaire pour reconstituer la hiérarchie administrative d'un lieu
// telle qu'établie par un acte (module Réconciliation, revue avant fusion).
export type EntityFact = {
  id: string
  label: string
  sourceText: string
  documentTitre: string
  documentDate: string | null
  exemplaireId: string
  versionId: string
  predicateCode: string
  valueText: string | null
  valueNumber: number | null
  valueDate: string | null
  objectLabel: string | null
  objectEntityId: string | null
}

// Une relation directe (père/mère/conjoint/enfant/frère-sœur/proche/
// voisin/ami) résolue vers une autre entité canonique si elle a déjà été
// promue, sinon vers un simple libellé non cliquable. Porte aussi la
// référence de l'acte source (même esprit que EntityFact) — le tableau
// "Ligne de vie" du module Individu en a besoin pour rattacher un rôle
// (ex. "Mère") à la bonne ligne/acte, y compris quand aucun autre fait n'a
// été extrait pour cette personne sur cet acte précis. id = l'assertion
// source (transcription_assertions.id, même table que les faits) —
// utilisable comme source_fact_id pour sourcer un champ (onglet
// "Informations à valider" > "Par acte").
export type EntityRelation = {
  id: string
  predicateLabel: string
  // Rôle de L'ENTITÉ ELLE-MÊME (pas de la cible) dans cette relation — ex.
  // "Mère" pour Charbonné dans une relation affichée "Enfant : Gabrielle"
  // (predicateLabel décrit le rôle de la cible, ownRoleLabel le sien).
  // Sert à pré-remplir le champ "Rôle" d'un acte (module Individu,
  // "Informations à valider" > "Par acte") avec la bonne valeur.
  ownRoleLabel: string
  targetLabel: string
  targetEntityId: string | null
  exemplaireId: string
  versionId: string
  documentTitre: string
  documentDate: string | null
}

export type EntityDetail = CanonicalEntity & {
  facts: EntityFact[]
  // Faits validés où cette entité n'est PAS le sujet mais seulement l'OBJET
  // (ex. "Pineau — circonscription administrative : Deshaies" sur la fiche
  // de Deshaies), et dont le prédicat n'est pas relationnel personne-personne
  // (ceux-là vont dans `relations`, voir INVERSE_RELATION_LABEL). Distinct
  // de `facts` plutôt que fusionné dedans : `facts` reste strictement
  // sujet-only car réutilisé par IndividuFiche pour l'auto-suggestion de
  // champs par acte (PREDICATE_TO_FIELD), qui n'a de sens que pour des faits
  // À PROPOS de l'entité, pas la citant en passant. computeEntityCounts
  // compte déjà ces mentions dans factsCount/documentsCount (2026-08-15) —
  // `mentions` permet aux écrans d'affichage (fiche, revue avant fusion) de
  // rester cohérents avec ce compteur plutôt que de sous-afficher.
  mentions: EntityFact[]
  relations: EntityRelation[]
  documents: { exemplaireId: string; versionId: string; titre: string; date: string | null }[]
}

// Une information d'identité validée manuellement pour une entité — voir
// rebond.entity_attributes / onglet "Informations à valider" du module
// Individu. versionId distingue les deux niveaux de validation :
//   - null      : valeur globale à l'entité (synthèse cross-actes, ex. la
//                 date de naissance retenue parmi plusieurs mentions
//                 concurrentes dans les faits)
//   - renseigné : valeur propre à CET acte précis (fiche "acteur" par acte,
//                 sous-onglet "Par acte" — même attribut, valeur différente
//                 possible d'un acte à l'autre avant toute synthèse)
// Un nœud de l'arbre hiérarchique DESCENDANT d'un lieu (commune -> ses
// sections -> leurs hameaux -> leurs habitations...) — voir
// fetchPlaceDescendants (entites.service.ts), symétrique de
// fetchPlaceHierarchies qui remonte plutôt qu'elle ne descend. entityId
// permet de faire un lien cliquable vers la fiche de chaque enfant.
export type PlaceTreeNode = {
  entityId: string
  label: string
  quality: string | null
  children: PlaceTreeNode[]
}

export type EntityAttribute = {
  id: string
  attributeCode: string
  value: string
  sourceFactIds: string[]
  validatedAt: string
  versionId: string | null
}
