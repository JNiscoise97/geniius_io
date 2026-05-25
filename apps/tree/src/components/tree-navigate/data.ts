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
} from 'lucide-react'

import type { FamilyView, MainTab } from './types'
import { FAMILY_GRAPH } from '../../features/family-tree/loadGraph'

export type FamilyGraphPerson = {
  id: string
  firstName: string
  lastName: string
  nickname?: string
  sex: 'M' | 'F' | 'U'
  birthDate?: string
  deathDate?: string
  birthYear?: string
  deathYear?: string
  birthPlace?: string
  deathPlace?: string
  famcIds: string[]
  famsIds: string[]
  branch?: string[]
}

export type FamilyGraphFamily = {
  id: string
  husbandId?: string
  wifeId?: string
  childIds: string[]
}

export type FamilyGraphGenerated = {
  people: Record<string, FamilyGraphPerson>
  families: Record<string, FamilyGraphFamily>
}

export const graph = FAMILY_GRAPH

export const mainTabs: { key: MainTab; label: string }[] = [
  { key: 'famille', label: 'Famille' },
  { key: 'saisie', label: 'Saisie' },
  { key: 'histoire', label: 'Histoire' },
  { key: 'recherches', label: 'Recherches' },
  { key: 'graphiques', label: 'Graphiques' },
]

export const familyViews: { key: FamilyView; label: string }[] = [
  { key: 'noyau', label: 'Noyau familial' },
  { key: 'ascendance', label: 'Ascendance' },
  { key: 'descendance', label: 'Descendance' },
]

export const toolbar = [
  { icon: Cloud, label: 'Nouveautés' },
  { icon: Database, label: 'Online' },
  { icon: Share2, label: 'Publier' },
  { icon: Bell, label: 'Alertes' },
  { icon: ArrowLeft, label: 'Précédent' },
  { icon: ChevronRight, label: 'Suivant' },
  { icon: Home, label: 'Accueil' },
  { icon: Plus, label: 'Ajouter' },
  { icon: Pencil, label: 'Saisir' },
  { icon: Trash2, label: 'Supprimer' },
  { icon: CheckCircle2, label: 'Cohérence' },
  { icon: Search, label: 'Rechercher' },
  { icon: Archive, label: 'Archives' },
  { icon: Library, label: 'Dictionnaires' },
  { icon: TreePine, label: 'Arbres' },
  { icon: FileText, label: 'Fiches' },
  { icon: BookOpen, label: 'Livres' },
  { icon: Info, label: 'Infos' },
]

export const people = Object.values(graph.people)
  .map((person) => [
    formatPersonName(person),
    formatYears(person),
    formatSex(person.sex),
    person.id,
  ] as const)
  .sort(([nameA], [nameB]) => nameA.localeCompare(nameB, 'fr'))

export const searchResults = Object.values(graph.people)
  .slice(0, 50)
  .map((person) => [
    person.lastName,
    person.firstName,
    person.birthDate ?? person.birthYear ?? '',
    person.birthPlace ?? '',
    person.deathDate ?? person.deathYear ?? '',
    person.deathPlace ?? '',
  ])

export const descendants = Object.values(graph.people)
  .slice(0, 30)
  .map((person) => [
    formatPersonName(person),
    formatPersonDetails(person),
  ])

export const events = [
  ['Naissance', '1833', '', 'Saint-Paul'],
  ['Émancipation par décret d’abolition', '1848', '15', 'Saint-Paul'],
  ['Mariage', '1849', '16', 'Saint-Paul'],
  ['Décès', '1862', '29', 'Saint-Paul'],
]

export function getPerson(personId?: string) {
  if (!personId) return undefined
  return graph.people[personId]
}

export function getFamily(familyId?: string) {
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

export function getSpouseFamilies(personId: string) {
  const person = getPerson(personId)

  return person?.famsIds
    .map((familyId) => graph.families[familyId])
    .filter(Boolean) ?? []
}

export function getChildren(personId: string) {
  return getSpouseFamilies(personId).flatMap((family) =>
    family.childIds
      .map((childId) => graph.people[childId])
      .filter(Boolean),
  )
}

export function getSpouses(personId: string) {
  return getSpouseFamilies(personId)
    .map((family) => {
      const spouseId =
        family.husbandId === personId ? family.wifeId : family.husbandId

      return spouseId ? graph.people[spouseId] : undefined
    })
    .filter(Boolean)
}

export function formatPersonName(person: FamilyGraphPerson) {
  return [person.lastName, person.firstName].filter(Boolean).join(' ')
}

export function formatYears(person: FamilyGraphPerson) {
  const birth = person.birthYear ?? ''
  const death = person.deathYear ?? ''

  if (!birth && !death) return ''
  return `${birth}–${death}`
}

export function formatSex(sex: FamilyGraphPerson['sex']) {
  if (sex === 'M') return '♂'
  if (sex === 'F') return '♀'
  return '·'
}

export function formatPersonDetails(person: FamilyGraphPerson) {
  const years = formatYears(person)
  const birthPlace = person.birthPlace ? ` · ${person.birthPlace}` : ''

  return `${years}${birthPlace}`
}