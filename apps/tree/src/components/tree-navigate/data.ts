import {
  Archive,
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Database,
  FileText,
  Home,
  Info,
  Library,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  TreePine,
  User,
} from 'lucide-react'

import type { DocumentsView, FamilyView, HistoryView, MainTab } from './types'
import { FAMILY_GRAPH } from '../../features/family-tree/loadGraph'
import {
  getBirth,
  getDeath,
  getEvent,
  getYear,
  type FamilyGraphPerson,
  type FamilyGraphFamily,
  type GedcomMedia,
  type GedcomPlace,
  type GedcomEvent,
  type GedcomEventTag,
  type GedcomDate,
} from '@geniius/utils/family-graph'

// ── Ré-exports ────────────────────────────────────────────────────────────────
export type {
  FamilyGraphPerson,
  FamilyGraphFamily,
  GedcomMedia,
  GedcomPlace,
  GedcomEvent,
  GedcomEventTag,
  GedcomDate,
}

export type FamilyGraphGenerated = {
  people: Record<string, FamilyGraphPerson>
  families: Record<string, FamilyGraphFamily>
  media: Record<string, GedcomMedia>
}

// ─────────────────────────────────────────────────────────────────────────────

export const graph = FAMILY_GRAPH

export const mainTabs: { key: MainTab; label: string }[] = [
  { key: 'famille',    label: 'Famille' },
  { key: 'saisie',     label: 'Saisie' },
  { key: 'histoire',   label: 'Histoire' },
  { key: 'documents',  label: 'Documents' },
  { key: 'graphiques', label: 'Graphiques' },
]

export const familyViews: { key: FamilyView; label: string }[] = [
  { key: 'noyau',       label: 'Noyau familial' },
  { key: 'ascendance',  label: 'Ascendance' },
  { key: 'descendance', label: 'Descendance' },
]

export const documentsViews: { key: DocumentsView; label: string }[] = [
  { key: 'medias',  label: 'Photos & Médias' },
  { key: 'actes',   label: 'Actes & Sources' },
  { key: 'exports', label: 'Exports' },
]

export const historyViews: { key: HistoryView; label: string }[] = [
  { key: 'chronologie',       label: 'Chronologie' },
]

export const toolbar = [
  { icon: User,         label: 'Sosa' },
  { icon: Cloud,        label: 'Nouveautés' },
  { icon: Database,     label: 'Online' },
  { icon: Share2,       label: 'Publier' },
  { icon: Bell,         label: 'Alertes' },
  { icon: ArrowLeft,    label: 'Précédent' },
  { icon: ChevronRight, label: 'Suivant' },
  { icon: Home,         label: 'Accueil' },
  { icon: Plus,         label: 'Ajouter' },
  { icon: Pencil,       label: 'Saisir' },
  { icon: Trash2,       label: 'Supprimer' },
  { icon: CheckCircle2, label: 'Cohérence' },
  { icon: Search,       label: 'Rechercher' },
  { icon: Archive,      label: 'Archives' },
  { icon: Library,      label: 'Dictionnaires' },
  { icon: TreePine,     label: 'Arbres' },
  { icon: FileText,     label: 'Fiches' },
  { icon: BookOpen,     label: 'Livres' },
  { icon: Info,         label: 'Infos' },
]

// Computed lazily at call time (after the Suspense boundary resolves the JSON)
export function getAllPeople() {
  return Object.values(graph.people)
    .map((person) => [
      formatPersonName(person),
      formatYears(person),
      formatSex(person.sex),
      person.id,
    ] as const)
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB, 'fr'))
}

export const events = [
  ['Naissance',                           '1833', '',   'Saint-Paul'],
  ["Émancipation par décret d'abolition", '1848', '15', 'Saint-Paul'],
  ['Mariage',                             '1849', '16', 'Saint-Paul'],
  ['Décès',                               '1862', '29', 'Saint-Paul'],
]

// ── Accesseurs ────────────────────────────────────────────────────────────────

export function getPerson(personId?: string): FamilyGraphPerson | undefined {
  if (!personId) return undefined
  return graph.people[personId]
}

export function getFamily(familyId?: string): FamilyGraphFamily | undefined {
  if (!familyId) return undefined
  return graph.families[familyId]
}

export function getParents(personId: string) {
  const person = getPerson(personId)
  const family = getFamily(person?.famcIds?.[0])
  return {
    father: getPerson(family?.husbandId),
    mother: getPerson(family?.wifeId),
    family,
  }
}

export function getSpouseFamilies(personId: string): FamilyGraphFamily[] {
  const person = getPerson(personId)
  return (
    person?.famsIds
      .map((familyId) => graph.families[familyId])
      .filter(Boolean) ?? []
  )
}

export function getChildren(personId: string): FamilyGraphPerson[] {
  return getSpouseFamilies(personId).flatMap((family) =>
    family.childIds
      .map((childId) => graph.people[childId])
      .filter(Boolean),
  )
}

export function getSpouses(personId: string): FamilyGraphPerson[] {
  return getSpouseFamilies(personId)
    .map((family) => {
      const spouseId =
        family.husbandId === personId ? family.wifeId : family.husbandId
      return spouseId ? graph.people[spouseId] : undefined
    })
    .filter((p): p is FamilyGraphPerson => p !== undefined)
}

// ── Formatage ─────────────────────────────────────────────────────────────────

export function formatPersonName(person: FamilyGraphPerson): string {
  return [person.lastName, person.firstName].filter(Boolean).join(' ')
}

export function formatYears(person: FamilyGraphPerson): string {
  const birthYear = getYear(getBirth(person)?.date)
  const deathYear = getYear(getDeath(person)?.date)
  if (!birthYear && !deathYear) return ''
  return `${birthYear ?? ''}–${deathYear ?? ''}`
}

export function formatSex(sex: FamilyGraphPerson['sex']): string {
  if (sex === 'M') return '♂'
  if (sex === 'F') return '♀'
  return '·'
}

export function formatPersonDetails(person: FamilyGraphPerson): string {
  const years      = formatYears(person)
  const birthPlace = getBirth(person)?.placeBrut
  return years + (birthPlace ? ` · ${birthPlace}` : '')
}

// ── Ascendance ────────────────────────────────────────────────────────────────

export type AscendancePersonNode = {
  id?: string
  firstName?: string
  lastName?: string
  nickname?: string
  sex?: 'M' | 'F' | 'U'
  birthYear?: number
  deathYear?: number
  tone: 'neutral' | 'source' | 'hypothesis'
  empty?: boolean
  emptyLabel?: string
}

export type AscendanceGeneration = {
  label: string
  people: AscendancePersonNode[]
}

export function buildAscendanceGenerations(
  rootPersonId?: string,
  generationCount = 6,
): AscendanceGeneration[] {
  const root = getPerson(rootPersonId)

  const generations: AscendanceGeneration[] = []
  let currentGeneration: Array<FamilyGraphPerson | undefined> = [root]

  for (
    let generationIndex = 0;
    generationIndex < generationCount;
    generationIndex++
  ) {
    const generationNumber = generationIndex + 1

    generations.push({
      label: getGenerationLabel(generationNumber),
      people: currentGeneration.map((person, index) => {
        if (!person) {
          return {
            empty: true,
            emptyLabel: `Ajouter ${getMissingAncestorLabel(generationIndex, index)}`,
            tone: 'neutral',
          }
        }

        return {
          id:        person.id,
          firstName: person.firstName,
          lastName:  person.lastName,
          nickname:  person.nickname,
          sex:       person.sex,
          birthYear: getYear(getBirth(person)?.date),
          deathYear: getYear(getDeath(person)?.date),
          tone: 'neutral',
        }
      }),
    })

    currentGeneration = currentGeneration.flatMap((person) => {
      if (!person) return [undefined, undefined]
      const parents = getParents(person.id)
      return [parents.father, parents.mother]
    })
  }

  return generations
}

function getGenerationLabel(generation: number): string {
  if (generation === 1) return 'Génération 1'
  if (generation === 2) return 'Parents'
  if (generation === 3) return 'Grands-parents'
  if (generation === 4) return 'Arrière-grands-parents'
  return `Génération ${generation}`
}

function getMissingAncestorLabel(
  generationIndex: number,
  personIndex: number,
): string {
  if (generationIndex === 0) return "l'individu"
  if (generationIndex === 1) return personIndex === 0 ? 'le père' : 'la mère'
  const isMaleSlot = personIndex % 2 === 0
  return isMaleSlot ? 'le grand-père' : 'la grand-mère'
}

// ── Descendance ───────────────────────────────────────────────────────────────

export type DescendantPersonNode = {
  id: string
  firstName?: string
  lastName?: string
  sex?: 'M' | 'F' | 'U'
  birthYear?: number
  deathYear?: number
  children: DescendantPersonNode[]
}

export function buildDescendantTree(
  personId: string | undefined,
  maxDepth = 3,
): DescendantPersonNode | null {
  if (!personId) return null
  return buildDescRec(personId, maxDepth, 0, new Set<string>())
}

function buildDescRec(
  personId: string,
  maxDepth: number,
  depth: number,
  visited: Set<string>,
): DescendantPersonNode {
  const person = getPerson(personId)
  const node: DescendantPersonNode = {
    id: personId,
    firstName: person?.firstName,
    lastName: person?.lastName,
    sex: person?.sex,
    birthYear: person ? getYear(getBirth(person)?.date) : undefined,
    deathYear: person ? getYear(getDeath(person)?.date) : undefined,
    children: [],
  }

  if (depth >= maxDepth || visited.has(personId)) return node
  visited.add(personId)

  node.children = getChildren(personId).map((child) =>
    buildDescRec(child.id, maxDepth, depth + 1, visited),
  )

  return node
}

// ── Médias ────────────────────────────────────────────────────────────────────

const MEDIA_BASE_URL =
  '/data/Jordan Michel Nisçoise-20260525/Jordan Michel Nisçoise-20260525-Medias'

export function getPersonPrimaryPhoto(personId: string): string | undefined {
  const person = getPerson(personId)
  if (!person?.primaryMediaId) return undefined
  const title = (graph as FamilyGraphGenerated).media?.[person.primaryMediaId]?.title
  if (!title) return undefined
  return `${MEDIA_BASE_URL}/${title}`
}