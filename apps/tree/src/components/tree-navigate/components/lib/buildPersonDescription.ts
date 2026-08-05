import { calculateAge } from '@geniius/utils/family-graph-utils'
import { getBirth, getDeath, type FamilyGraphPerson, type GedcomEvent } from '@geniius/utils/family-graph'
import { MISSING_DEATH } from '../../../../../../../packages/geniius-utils/src/lib/calculate-age'

import { getChildren, getParents, getPerson, getSpouseFamilies, getSpouses } from '../../data'
import { getAssocIndex } from './assocIndex'
import { fmtDate, formatDisplayName, formatPlace } from './formatPersonInfos'
import { resolveRoleLabel } from './resolveRoleLabel'

export type DescriptionSegment =
  | { kind: 'text'; text: string }
  | { kind: 'person'; personId: string; label: string }
  | { kind: 'place'; query: string; label: string }

export type DescriptionParagraph = DescriptionSegment[]

function t(text: string): DescriptionSegment {
  return { kind: 'text', text }
}

function p(personId: string, label: string): DescriptionSegment {
  return { kind: 'person', personId, label }
}

function l(query: string, label: string): DescriptionSegment {
  return { kind: 'place', query, label }
}

function pronoun(sex: FamilyGraphPerson['sex']) {
  if (sex === 'F') return { subject: 'Elle', bornWord: 'née', deadWord: 'décédée', childArticle: 'la', childWord: 'fille', assocWord: 'associée' }
  if (sex === 'M') return { subject: 'Il', bornWord: 'né', deadWord: 'décédé', childArticle: 'le', childWord: 'fils', assocWord: 'associé' }
  return { subject: 'Cette personne', bornWord: 'né(e)', deadWord: 'décédé(e)', childArticle: "l'", childWord: 'enfant', assocWord: 'associé(e)' }
}

export function hasSource(event: { sourcePage?: string; sourceQuay?: string }): boolean {
  const quay = Number(event.sourceQuay)
  return (event.sourcePage !== undefined && event.sourcePage !== '') || quay >= 2
}

function place(brut?: string, structured?: Parameters<typeof formatPlace>[0]): string {
  return formatPlace(structured) || (brut ? formatPlace(brut) : '')
}

/**
 * Segments pour une mention de lieu dans le texte : le nom le plus précis
 * (commune, ou à défaut le lieu-dit) devient un lien de recherche, le
 * département/région/pays reste en texte entre parenthèses.
 */
function placeSegments(brut?: string, structured?: GedcomEvent['place']): DescriptionSegment[] {
  const primaryLabel = structured?.town || structured?.subdivision || structured?.raw || brut
  if (!primaryLabel) return []

  const extras = [structured?.county, structured?.region, structured?.country].filter(Boolean) as string[]
  const segments: DescriptionSegment[] = [l(primaryLabel, primaryLabel)]
  if (extras.length > 0) segments.push(t(` (${extras.join(', ')})`))
  return segments
}

/**
 * Génère, à partir des actes déjà rattachés à l'individu, une description en
 * prose de ce qu'on sait de lui — plutôt qu'une liste de champs à parcourir.
 * Chaque paragraphe est une suite de segments texte / personne, pour que
 * l'UI puisse rendre les noms cités comme des liens de navigation.
 */
export function buildPersonDescription(person: FamilyGraphPerson): DescriptionParagraph[] {
  const { subject, bornWord, deadWord, childArticle, childWord, assocWord } = pronoun(person.sex)
  const paragraphs: DescriptionParagraph[] = []

  // ── Naissance ──────────────────────────────────────────────────────────────
  const birth = getBirth(person)
  const death = getDeath(person)
  const birthDate = fmtDate(birth?.date)
  const birthPlace = place(birth?.placeBrut, birth?.place)

  const birthSeg: DescriptionSegment[] = [t(`${formatDisplayName(person)} est ${bornWord}`)]
  if (birthDate) birthSeg.push(t(` le ${birthDate}`))
  if (birthPlace) birthSeg.push(t(`${birthDate ? ',' : ''} à ${birthPlace}`))
  if (!birthDate && !birthPlace) birthSeg.push(t(", mais ni la date ni le lieu ne sont documentés"))
  birthSeg.push(t('.'))
  paragraphs.push(birthSeg)

  // ── Décès ──────────────────────────────────────────────────────────────────
  const deathDate = fmtDate(death?.date)
  const deathPlace = place(death?.placeBrut, death?.place)
  const age = calculateAge(birth?.date, death?.date)

  if (deathDate || deathPlace) {
    const deathSeg: DescriptionSegment[] = [t(`${subject} est ${deadWord}`)]
    if (deathDate) deathSeg.push(t(` le ${deathDate}`))
    if (deathPlace) deathSeg.push(t(`${deathDate ? ',' : ''} à ${deathPlace}`))
    if (typeof age === 'string' && age !== MISSING_DEATH) deathSeg.push(t(`, à l'âge de ${age}`))
    deathSeg.push(t('.'))
    paragraphs.push(deathSeg)
  } else if (age === MISSING_DEATH) {
    paragraphs.push([
      t("Son décès n'est pas documenté, alors que son âge présumé rend peu probable qu'elle soit encore en vie."),
    ])
  }

  // ── Profession ─────────────────────────────────────────────────────────────
  if (person.occupation) {
    const tense = death ? 'exerçait' : 'exerce'
    paragraphs.push([t(`${subject} ${tense} la profession de ${person.occupation.toLowerCase()}.`)])
  }

  // ── Parents ────────────────────────────────────────────────────────────────
  const { father, mother } = getParents(person.id)
  if (father || mother) {
    const seg: DescriptionSegment[] = [t(`${subject} est ${childArticle} ${childWord} de `)]
    if (father) seg.push(p(father.id, formatDisplayName(father)))
    if (father && mother) seg.push(t(' et de '))
    if (mother) seg.push(p(mother.id, formatDisplayName(mother)))
    seg.push(t('.'))
    paragraphs.push(seg)
  }

  // ── Union(s) ───────────────────────────────────────────────────────────────
  const spouses = getSpouses(person.id)
  const spouseFamilies = getSpouseFamilies(person.id)

  spouses.forEach((spouse, index) => {
    const marriage = spouseFamilies[index]?.events.find((event) => event.tag === 'MARR')
    const marriageDate = fmtDate(marriage?.date)

    const seg: DescriptionSegment[] = [t(`${subject} épouse `), p(spouse.id, formatDisplayName(spouse))]
    if (marriageDate) seg.push(t(` le ${marriageDate}`))
    seg.push(t('.'))
    paragraphs.push(seg)
  })

  // ── Enfants ────────────────────────────────────────────────────────────────
  const children = getChildren(person.id)
  if (children.length > 0) {
    const count = children.length
    paragraphs.push([
      t(`${subject} a ${count} enfant${count > 1 ? 's' : ''} connu${count > 1 ? 's' : ''}${spouses.length > 1 ? ', toutes unions confondues' : ''}.`),
    ])
  }

  // ── Sources ────────────────────────────────────────────────────────────────
  const sourcedCount = person.events.filter(hasSource).length
  const assocCount = countUniqueAssocOccurrences(person.id)

  const sourceParts: string[] = []
  if (person.events.length > 0) {
    sourceParts.push(
      `${person.events.length} acte${person.events.length > 1 ? 's' : ''} mentionne${person.events.length > 1 ? 'nt' : ''} directement cette personne, dont ${sourcedCount} sourcé${sourcedCount > 1 ? 's' : ''}`,
    )
  }
  if (assocCount > 0) {
    sourceParts.push(
      `${subject.toLowerCase()} apparaît par ailleurs comme témoin ou ${assocWord} dans ${assocCount} autre${assocCount > 1 ? 's' : ''} acte${assocCount > 1 ? 's' : ''}`,
    )
  }

  paragraphs.push([
    t(sourceParts.length > 0 ? `${capitalize(sourceParts.join(', '))}.` : "Aucun acte n'est encore rattaché à cette personne."),
  ])

  return paragraphs
}

/**
 * Récit en prose de l'acte de naissance : date, lieu (cliquable) et
 * personnes présentes à l'acte (déclarant, témoins…), chacune cliquable.
 * Ne reprend pas la fiabilité de la source — affichée à part, en évidence.
 */
export function buildBirthNarrative(person: FamilyGraphPerson): DescriptionParagraph[] {
  const { bornWord } = pronoun(person.sex)
  const birth = getBirth(person)

  if (!birth) {
    return [[t("Aucun acte de naissance n'est encore rattaché à cette personne.")]]
  }

  const paragraphs: DescriptionParagraph[] = []
  const dateLabel = fmtDate(birth.date)
  const placeSeg = placeSegments(birth.placeBrut, birth.place)

  const mainSeg: DescriptionSegment[] = [t(`${formatDisplayName(person)} est ${bornWord}`)]
  if (dateLabel) mainSeg.push(t(` le ${dateLabel}`))
  if (placeSeg.length > 0) {
    mainSeg.push(t(`${dateLabel ? ',' : ''} à `))
    mainSeg.push(...placeSeg)
  }
  if (!dateLabel && placeSeg.length === 0) {
    mainSeg.push(t(', mais ni la date ni le lieu ne sont documentés'))
  }
  mainSeg.push(t('.'))
  paragraphs.push(mainSeg)

  if (birth.note) {
    paragraphs.push([t(birth.note)])
  }

  const namedAssocs = birth.assocs.filter((assoc) => assoc.id || assoc.title)
  if (namedAssocs.length > 0) {
    const seg: DescriptionSegment[] = [t('En présence de ')]

    namedAssocs.forEach((assoc, index) => {
      const role = resolveRoleLabel(assoc)
      const assocPerson = assoc.id ? getPerson(assoc.id) : undefined
      const label = assocPerson ? formatDisplayName(assocPerson) : (assoc.title ?? '')

      if (index > 0) seg.push(t(index === namedAssocs.length - 1 ? ' et ' : ', '))
      seg.push(assocPerson ? p(assocPerson.id, label) : t(label))
      if (role) seg.push(t(` (${role.toLowerCase()})`))
    })

    seg.push(t('.'))
    paragraphs.push(seg)
  }

  return paragraphs
}

function countUniqueAssocOccurrences(personId: string): number {
  const seen = new Set<unknown>()
  return (getAssocIndex().get(personId) ?? []).filter((occurrence) => {
    if (seen.has(occurrence.event)) return false
    seen.add(occurrence.event)
    return true
  }).length
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
